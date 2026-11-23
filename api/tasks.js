const { requireAdmin, handlePreflight, getRequestBody } = require('./_lib/auth');
const { readJson, writeJson } = require('./_lib/storage');
const { dispatchNotification } = require('./_lib/notify');

const TASKS_FILE = 'tasks.json';
const VALID_STATUSES = ['todo', 'in_progress', 'done'];
const VALID_PRIORITIES = ['low', 'normal', 'high'];

function isTaskOverdue(t) {
  if (!t || t.status === 'done' || !t.dueDate) return false;
  const dueTs = new Date(t.dueDate).getTime();
  if (Number.isNaN(dueTs)) return false;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  return dueTs < todayStart.getTime();
}

function normalizeSubtasks(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((s) => s && String(s.title || '').trim() !== '')
    .map((s, idx) => ({
      id: s.id || `sub_${Date.now()}_${idx}`,
      title: String(s.title).trim(),
      done: Boolean(s.done),
    }));
}

function normalizeTags(raw) {
  if (Array.isArray(raw)) {
    return raw.map((t) => String(t).trim()).filter(Boolean).slice(0, 8);
  }
  if (typeof raw === 'string') {
    return raw
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 8);
  }
  return [];
}

function normalizeTaskRecord(raw) {
  const status = VALID_STATUSES.includes(raw.status) ? raw.status : 'todo';
  const priority = VALID_PRIORITIES.includes(raw.priority) ? raw.priority : 'normal';
  const primaryAssignee = String(raw.assignee || 'Bidjou Mohamed').trim() || 'Bidjou Mohamed';
  const rawAssignees = Array.isArray(raw.assignees)
    ? raw.assignees.map((a) => String(a).trim()).filter(Boolean)
    : [primaryAssignee];
  if (rawAssignees.length === 0) rawAssignees.push(primaryAssignee);

  const task = {
    id: raw.id || `task_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    title: String(raw.title || '').trim(),
    description: String(raw.description || '').trim(),
    project: String(raw.project || 'Commercial AI Film').trim(),
    tags: normalizeTags(raw.tags),
    status,
    priority,
    dueDate: raw.dueDate || '',
    assignee: rawAssignees[0],
    assignees: Array.from(new Set(rawAssignees)),
    subtasks: normalizeSubtasks(raw.subtasks),
    comments: Array.isArray(raw.comments) ? raw.comments : [],
    estimatedHours: Math.max(0, Number(raw.estimatedHours || 0) || 0),
    completedAt: status === 'done' ? raw.completedAt || new Date().toISOString() : undefined,
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || undefined,
  };

  return {
    ...task,
    isOverdue: isTaskOverdue(task),
  };
}

module.exports = async (req, res) => {
  if (handlePreflight(req, res, 'GET,POST,PATCH,DELETE,OPTIONS')) return;
  if (!requireAdmin(req, res)) return;

  const list = readJson(TASKS_FILE, []);
  const tasks = (Array.isArray(list) ? list : []).map(normalizeTaskRecord);

  if (req.method === 'GET') {
    return res.status(200).json(tasks);
  }

  if (req.method === 'POST') {
    const body = getRequestBody(req);
    const title = String(body.title || '').trim();
    if (!title) return res.status(400).json({ error: 'Task title is required.' });

    const task = normalizeTaskRecord({ ...body, title });
    tasks.unshift(task);
    writeJson(
      TASKS_FILE,
      tasks.map(({ isOverdue, ...rest }) => rest)
    );
    await dispatchNotification('task_created', task);

    return res.status(201).json({ ok: true, task });
  }

  if (req.method === 'PATCH') {
    const body = getRequestBody(req);

    // Full array reorder / replacement
    if (Array.isArray(body.tasks)) {
      const normalized = body.tasks.map(normalizeTaskRecord);
      writeJson(
        TASKS_FILE,
        normalized.map(({ isOverdue, ...rest }) => rest)
      );
      return res.status(200).json({ ok: true, tasks: normalized });
    }

    // Bulk status update
    if (body.action === 'bulk_status' && Array.isArray(body.ids)) {
      const nextStatus = VALID_STATUSES.includes(body.status) ? body.status : null;
      if (!nextStatus) return res.status(400).json({ error: 'Invalid status value.' });
      const idSet = new Set(body.ids.map(String));
      let updatedCount = 0;
      const nextList = tasks.map((t) => {
        if (!idSet.has(t.id)) return t;
        updatedCount += 1;
        return normalizeTaskRecord({
          ...t,
          status: nextStatus,
          updatedAt: new Date().toISOString(),
        });
      });
      writeJson(
        TASKS_FILE,
        nextList.map(({ isOverdue, ...rest }) => rest)
      );
      return res.status(200).json({ ok: true, updatedCount });
    }

    const id = body.id || req.query?.id;
    if (!id) return res.status(400).json({ error: 'Task ID is required.' });
    const idx = tasks.findIndex((t) => t.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Task not found.' });

    // Append comment action
    if (body.action === 'add_comment') {
      const text = String(body.text || '').trim();
      if (!text) return res.status(400).json({ error: 'Comment text cannot be empty.' });
      const comment = {
        id: `cmt_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
        author: String(body.author || 'Bidjou Mohamed').trim(),
        text,
        createdAt: new Date().toISOString(),
      };
      const updated = normalizeTaskRecord({
        ...tasks[idx],
        comments: [...(tasks[idx].comments || []), comment],
        updatedAt: new Date().toISOString(),
      });
      tasks[idx] = updated;
      writeJson(
        TASKS_FILE,
        tasks.map(({ isOverdue, ...rest }) => rest)
      );
      return res.status(200).json({ ok: true, task: updated });
    }

    const updated = normalizeTaskRecord({
      ...tasks[idx],
      ...body,
      id,
      updatedAt: new Date().toISOString(),
    });
    tasks[idx] = updated;
    writeJson(
      TASKS_FILE,
      tasks.map(({ isOverdue, ...rest }) => rest)
    );
    return res.status(200).json({ ok: true, task: updated });
  }

  if (req.method === 'DELETE') {
    const body = getRequestBody(req);
    const idsParam = req.query?.ids ? String(req.query.ids).split(',') : null;
    const bulkIds = Array.isArray(body.ids) ? body.ids : idsParam;
    if (bulkIds && bulkIds.length > 0) {
      const idSet = new Set(bulkIds.map(String));
      const next = tasks.filter((t) => !idSet.has(t.id));
      writeJson(
        TASKS_FILE,
        next.map(({ isOverdue, ...rest }) => rest)
      );
      return res.status(200).json({ ok: true, deletedCount: tasks.length - next.length });
    }

    const id = req.query?.id || body.id;
    if (!id) return res.status(400).json({ error: 'Task ID is required.' });
    const next = tasks.filter((t) => t.id !== id);
    writeJson(
      TASKS_FILE,
      next.map(({ isOverdue, ...rest }) => rest)
    );
    return res.status(200).json({ ok: true, id });
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
};
