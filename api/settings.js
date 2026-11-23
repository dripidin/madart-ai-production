const { requireAdmin, handlePreflight, getRequestBody } = require('./_lib/auth');
const { readJson, writeJson } = require('./_lib/storage');

const DEFAULT_SETTINGS = {
  cpp: [
    { handle: '@YouArtStudio', url: 'https://x.com/YouArtStudio', platform: 'x' },
    { handle: '@ImagineArt_X', url: 'https://x.com/ImagineArt_X', platform: 'x' },
    { handle: '@yesand_ai', url: 'https://x.com/yesand_ai', platform: 'x' },
  ],
  site: {
    contactEmail: 'hello@madeartagency.com',
    xUrl: 'https://x.com/BidjouMohamedAi',
    instagramUrl: 'https://www.instagram.com/bidjou.mohamed.ai/',
    threadsUrl: 'https://www.threads.net/@bidjou.mohamed.ai',
    heroTitle: 'MadeArt AI',
    studioName: 'MadeArt - AI Production',
  },
};

module.exports = async (req, res) => {
  if (handlePreflight(req, res, 'GET,POST,OPTIONS')) return;

  if (req.method === 'GET') {
    const data = readJson('settings.json', DEFAULT_SETTINGS);
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    if (!requireAdmin(req, res)) return;
    const body = getRequestBody(req);
    const current = readJson('settings.json', DEFAULT_SETTINGS);

    const updated = {
      cpp: Array.isArray(body.cpp) ? body.cpp : current.cpp,
      site: { ...(current.site || {}), ...(body.site || {}) },
    };

    const writeRes = writeJson('settings.json', updated);
    return res.status(200).json({ ok: true, settings: updated, persisted: writeRes.persisted });
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
};
