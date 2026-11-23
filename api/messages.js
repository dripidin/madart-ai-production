const { requireAdmin, handlePreflight, getRequestBody } = require('./_lib/auth');
const { readJson, writeJson } = require('./_lib/storage');
const { dispatchNotification } = require('./_lib/notify');
const { detectCountryCode } = require('./country');

const MESSAGES_FILE = 'messages.json';
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com',
  'tempmail.com',
  'guerrillamail.com',
  'yopmail.com',
  '10minutemail.com',
  'trashmail.com',
]);

module.exports = async (req, res) => {
  if (handlePreflight(req, res, 'GET,POST,PATCH,DELETE,OPTIONS')) return;

  const list = readJson(MESSAGES_FILE, []);
  const messages = Array.isArray(list) ? list : [];

  if (req.method === 'POST') {
    const body = getRequestBody(req);

    // Honeypot check
    if (body.hp_website && String(body.hp_website).trim() !== '') {
      return res.status(200).json({ ok: true, filtered: true });
    }

    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim();
    const message = String(body.message || body.brief || body.treatment || '').trim();

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    const domain = email.split('@')[1]?.toLowerCase() || '';
    if (!emailRegex.test(email) || DISPOSABLE_DOMAINS.has(domain)) {
      return res.status(400).json({ error: 'Please provide a valid non-disposable email address.' });
    }

    const geo = detectCountryCode(req, body.country || '');

    const item = {
      id: body.id || `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name,
      email,
      company: String(body.company || 'N/A').trim(),
      projectType: String(body.projectType || body['project-type'] || 'General Inquiry').trim(),
      message,
      extraFields: body.extraFields || undefined,
      country: geo.country,
      geoSource: geo.source,
      status: 'unread',
      createdAt: body.createdAt || new Date().toISOString(),
    };

    messages.unshift(item);
    const wr = writeJson(MESSAGES_FILE, messages.slice(0, 500));
    await dispatchNotification('form_submission', item);

    return res.status(200).json({ ok: true, id: item.id, country: item.country, message: item, persisted: wr.persisted });
  }

  if (!requireAdmin(req, res)) return;

  if (req.method === 'GET') {
    return res.status(200).json(messages);
  }

  if (req.method === 'PATCH') {
    const body = getRequestBody(req);
    const id = body.id || req.query?.id;
    if (!id) return res.status(400).json({ error: 'Message ID required.' });

    const idx = messages.findIndex((m) => m.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Message not found.' });

    if (body.status) {
      messages[idx].status = body.status;
      if (body.status === 'replied' && !messages[idx].repliedAt) {
        messages[idx].repliedAt = new Date().toISOString();
      }
      writeJson(MESSAGES_FILE, messages);
    }
    return res.status(200).json({ ok: true, message: messages[idx] });
  }

  if (req.method === 'DELETE') {
    const id = req.query?.id || getRequestBody(req).id;
    if (!id) return res.status(400).json({ error: 'Message ID is required.' });
    const next = messages.filter((m) => m.id !== id);
    writeJson(MESSAGES_FILE, next);
    return res.status(200).json({ ok: true, id });
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
};
