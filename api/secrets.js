const {
  requireAdmin,
  handlePreflight,
  getRequestBody,
} = require('./_lib/auth');
const {
  readSecrets,
  writeJson,
  isMaskedPlaceholder,
  getMaskedSecrets,
} = require('./_lib/storage');

module.exports = async (req, res) => {
  if (handlePreflight(req, res, 'GET,POST,OPTIONS')) return;
  if (!requireAdmin(req, res)) return;

  if (req.method === 'GET') {
    const secrets = readSecrets();
    return res.status(200).json(getMaskedSecrets(secrets));
  }

  if (req.method === 'POST') {
    const body = getRequestBody(req);
    const current = readSecrets();

    const updated = {
      gemini: {
        enabled:
          typeof body.gemini?.enabled === 'boolean'
            ? body.gemini.enabled
            : current.gemini.enabled,
        apiKey:
          body.gemini?.clear === true
            ? ''
            : typeof body.gemini?.apiKey === 'string' &&
              body.gemini.apiKey.trim() !== '' &&
              !isMaskedPlaceholder(body.gemini.apiKey.trim())
            ? body.gemini.apiKey.trim()
            : current.gemini.apiKey,
      },
    };

    const writeRes = writeJson('secrets.json', updated);
    return res.status(200).json({
      ok: true,
      persisted: writeRes.persisted,
      secrets: getMaskedSecrets(updated),
    });
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
};
