const fs = require('fs');
const path = require('path');
const { isAuthenticated, requireAdmin, handlePreflight, getRequestBody } = require('./_lib/auth');
const { ROOT_DIR, ensureDir, readJson, writeJson } = require('./_lib/storage');
const { dispatchNotification } = require('./_lib/notify');

const WORKS_FILE = 'works.json';

function parseYouTubeId(url) {
  if (!url || typeof url !== 'string') return null;
  const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2] && match[2].length === 11 ? match[2] : null;
}

function sanitizeFilename(name) {
  return String(name || 'video.mp4')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(-80);
}

function normalizeWorkInput(raw) {
  const title = String(raw.title || '').trim();
  const category = String(raw.category || 'COMMERCIAL / AI FILM').trim();
  let videoUrl = String(raw.videoUrl || '').trim();

  // Optional base64 uploaded file -> write under uploads/
  if (raw.fileBase64 && typeof raw.fileBase64 === 'string') {
    const uploadsDir = path.join(ROOT_DIR, 'uploads');
    ensureDir(uploadsDir);
    const base64Body = raw.fileBase64.includes(',') ? raw.fileBase64.split(',')[1] : raw.fileBase64;
    const safeName = `${Date.now()}_${sanitizeFilename(raw.fileName || 'upload.mp4')}`;
    const dest = path.join(uploadsDir, safeName);
    fs.writeFileSync(dest, Buffer.from(base64Body, 'base64'));
    videoUrl = `/uploads/${safeName}`;
  }

  const ytId = raw.youtubeId || parseYouTubeId(videoUrl);
  const thumbnailUrl = String(raw.thumbnailUrl || '').trim() ||
    (ytId ? `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg` : '');

  const nowIso = new Date().toISOString();
  const publishAt = raw.publishAt ? new Date(raw.publishAt).toISOString() : nowIso;

  return {
    id: raw.id || `work_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    title,
    category,
    videoUrl,
    youtubeId: ytId || null,
    videoType: ytId ? 'youtube' : 'mp4',
    thumbnailUrl,
    badge: String(raw.badge || '').trim(),
    description: raw.description || undefined,
    publishedAt: raw.publishedAt || publishAt,
    publishAt,
    isNewRelease: Boolean(raw.isNewRelease),
    featured: Boolean(raw.featured),
    createdAt: raw.createdAt || nowIso,
  };
}

module.exports = async (req, res) => {
  if (handlePreflight(req, res, 'GET,POST,PATCH,DELETE,OPTIONS')) return;

  const works = readJson(WORKS_FILE, []);
  const list = Array.isArray(works) ? works : [];

  if (req.method === 'GET') {
    const includeScheduled =
      req.query?.includeScheduled === 'true' && isAuthenticated(req);
    const categoryFilter = (req.query?.category || '').trim().toLowerCase();
    const now = Date.now();

    let filtered = includeScheduled
      ? list
      : list.filter((w) => {
          const dt = w.publishAt || w.publishedAt;
          if (!dt) return true;
          const ts = new Date(dt).getTime();
          return Number.isNaN(ts) || ts <= now;
        });

    if (categoryFilter && categoryFilter !== 'all') {
      filtered = filtered.filter((w) =>
        String(w.category || '').toLowerCase().includes(categoryFilter)
      );
    }

    return res.status(200).json(filtered);
  }

  if (!requireAdmin(req, res)) return;

  if (req.method === 'POST') {
    const body = getRequestBody(req);

    // Legacy bulk array replacement
    if (Array.isArray(body.works)) {
      const normalized = body.works.map((w) => normalizeWorkInput(w));
      const wr = writeJson(WORKS_FILE, normalized);
      return res.status(200).json({ ok: true, count: normalized.length, works: normalized, persisted: wr.persisted });
    }

    const workInput = body.work || body;
    if (!workInput.title || (!workInput.videoUrl && !workInput.fileBase64)) {
      return res.status(400).json({ error: 'Title and video URL or uploaded file are required.' });
    }

    const newWork = normalizeWorkInput(workInput);
    const updated = [newWork, ...list];
    const wr = writeJson(WORKS_FILE, updated);

    if (new Date(newWork.publishAt).getTime() > Date.now()) {
      await dispatchNotification('calendar_event', newWork);
    }

    return res.status(201).json({ ok: true, work: newWork, persisted: wr.persisted });
  }

  if (req.method === 'PATCH') {
    const body = getRequestBody(req);
    const id = body.id || req.query?.id;
    if (!id) return res.status(400).json({ error: 'Work ID is required.' });

    const idx = list.findIndex((w) => w.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Work not found.' });

    const merged = normalizeWorkInput({ ...list[idx], ...body, id });
    list[idx] = merged;
    const wr = writeJson(WORKS_FILE, list);
    return res.status(200).json({ ok: true, work: merged, persisted: wr.persisted });
  }

  if (req.method === 'DELETE') {
    const body = getRequestBody(req);
    const id = req.query?.id || body.id;
    if (!id) return res.status(400).json({ error: 'Work ID is required.' });

    const next = list.filter((w) => w.id !== id);
    if (next.length === list.length) {
      return res.status(404).json({ error: 'Work not found.' });
    }
    const wr = writeJson(WORKS_FILE, next);
    return res.status(200).json({ ok: true, id, persisted: wr.persisted });
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
};
