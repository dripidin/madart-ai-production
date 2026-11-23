const crypto = require('crypto');

const COOKIE_NAME = 'madeart_admin';

function getAdminPassword() {
  return process.env.ADMIN_PASSWORD || 'madeart2026';
}

function sha256(str) {
  return crypto.createHash('sha256').update(String(str || ''), 'utf8').digest();
}

function verifyPassword(candidate) {
  if (typeof candidate !== 'string' || !candidate) return false;
  const expectedBuf = sha256(getAdminPassword());
  const actualBuf = sha256(candidate);
  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}

function parseCookies(req) {
  const header = (req && req.headers && req.headers.cookie) || '';
  const result = {};
  header.split(';').forEach((part) => {
    const idx = part.indexOf('=');
    if (idx > 0) {
      const k = part.slice(0, idx).trim();
      const v = part.slice(idx + 1).trim();
      try {
        result[k] = decodeURIComponent(v);
      } catch (_) {
        result[k] = v;
      }
    }
  });
  return result;
}

function isAuthenticated(req) {
  const cookies = parseCookies(req);
  if (cookies[COOKIE_NAME] === '1') return true;
  const headerSecret = req && req.headers && req.headers['x-madeart-admin'];
  if (typeof headerSecret === 'string' && verifyPassword(headerSecret)) {
    return true;
  }
  return false;
}

function requireAdmin(req, res) {
  if (!isAuthenticated(req)) {
    res.status(401).json({ error: 'Unauthorized. Please log in to MadeArt Admin.' });
    return false;
  }
  return true;
}

function applyCors(req, res, methods = 'GET,POST,PATCH,DELETE,OPTIONS') {
  const origin = req && req.headers && req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-MadeArt-Admin');
}

function handlePreflight(req, res, methods) {
  applyCors(req, res, methods);
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  return false;
}

function getRequestBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch (_) {
      return {};
    }
  }
  return {};
}

module.exports = {
  COOKIE_NAME,
  getAdminPassword,
  verifyPassword,
  parseCookies,
  isAuthenticated,
  requireAdmin,
  applyCors,
  handlePreflight,
  getRequestBody,
};
