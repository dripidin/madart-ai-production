const geoip = require('geoip-lite');
const { handlePreflight } = require('./_lib/auth');

function extractClientIp(req) {
  const forwarded = req.headers && req.headers['x-forwarded-for'];
  let ip = '';
  if (typeof forwarded === 'string' && forwarded.trim()) {
    ip = forwarded.split(',')[0].trim();
  } else if (req.headers && req.headers['x-real-ip']) {
    ip = String(req.headers['x-real-ip']).trim();
  } else if (req.socket && req.socket.remoteAddress) {
    ip = req.socket.remoteAddress;
  }
  if (ip.startsWith('::ffff:')) {
    ip = ip.slice(7);
  }
  return ip;
}

function detectCountryCode(req, fallbackCountry = '') {
  const ip = extractClientIp(req);
  if (ip && ip !== '127.0.0.1' && ip !== '::1') {
    try {
      const geo = geoip.lookup(ip);
      if (geo && geo.country) {
        return { country: geo.country.toUpperCase(), ip, source: 'geoip-lite' };
      }
    } catch (_) {}
  }

  const headerCountry =
    (req.headers && (req.headers['x-vercel-ip-country'] || req.headers['cf-ipcountry'])) || '';
  if (headerCountry && String(headerCountry).trim() !== '') {
    return {
      country: String(headerCountry).trim().toUpperCase(),
      ip,
      source: 'proxy-header',
    };
  }

  if (fallbackCountry && String(fallbackCountry).trim() !== '' && fallbackCountry !== 'XX') {
    return {
      country: String(fallbackCountry).trim().toUpperCase(),
      ip,
      source: 'client-hint',
    };
  }

  return { country: 'XX', ip, source: 'unknown' };
}

const handler = async (req, res) => {
  if (handlePreflight(req, res, 'GET,OPTIONS')) return;
  const info = detectCountryCode(req);
  return res.status(200).json(info);
};

handler.detectCountryCode = detectCountryCode;
handler.extractClientIp = extractClientIp;
module.exports = handler;
