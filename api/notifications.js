const { requireAdmin, handlePreflight, getRequestBody } = require('./_lib/auth');
const { readJson, writeJson } = require('./_lib/storage');

const NOTIF_FILE = 'notifications.json';

module.exports = async (req, res) => {
  if (handlePreflight(req, res, 'GET,PATCH,DELETE,OPTIONS')) return;
  if (!requireAdmin(req, res)) return;

  const raw = readJson(NOTIF_FILE, []);
  const list = Array.isArray(raw) ? raw : [];

  if (req.method === 'GET') {
    const typeFilter = (req.query?.type || '').trim();
    const notifications =
      typeFilter && typeFilter !== 'all'
        ? list.filter((n) => n.type === typeFilter)
        : list;
    const unreadCount = list.filter((n) => !n.read).length;
    return res.status(200).json({ notifications, unreadCount });
  }

  if (req.method === 'PATCH') {
    const body = getRequestBody(req);
    if (body.action === 'mark_all_read') {
      const updated = list.map((n) => ({ ...n, read: true }));
      writeJson(NOTIF_FILE, updated);
      return res.status(200).json({ ok: true, unreadCount: 0 });
    }
    const id = body.id;
    if (!id) return res.status(400).json({ error: 'Notification ID is required.' });
    const updated = list.map((n) =>
      n.id === id ? { ...n, read: body.read !== false } : n
    );
    writeJson(NOTIF_FILE, updated);
    return res.status(200).json({ ok: true, unreadCount: updated.filter((n) => !n.read).length });
  }

  if (req.method === 'DELETE') {
    if (req.query?.clearAll === 'true') {
      writeJson(NOTIF_FILE, []);
      return res.status(200).json({ ok: true, unreadCount: 0 });
    }
    const id = req.query?.id || getRequestBody(req).id;
    if (!id) return res.status(400).json({ error: 'Notification ID is required.' });
    const next = list.filter((n) => n.id !== id);
    writeJson(NOTIF_FILE, next);
    return res.status(200).json({ ok: true, unreadCount: next.filter((n) => !n.read).length });
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
};
