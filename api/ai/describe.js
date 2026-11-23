const { requireAdmin, handlePreflight, getRequestBody } = require('../_lib/auth');
const { callGemini } = require('../_lib/gemini');

module.exports = async (req, res) => {
  if (handlePreflight(req, res, 'POST,OPTIONS')) return;
  if (!requireAdmin(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const body = getRequestBody(req);
  const title = String(body.title || '').trim();
  const category = String(body.category || 'Commercial / AI Production').trim();
  const context = String(body.context || '').trim();

  if (!title && !context) {
    return res.status(400).json({ error: 'Provide a work title or creative context.' });
  }

  try {
    const raw = await callGemini({
      systemInstruction:
        'You are the Executive Creative Director of MadeArt, a luxury AI production studio. Output strictly valid JSON with keys "en", "ar", and "fr". Each value must be a compelling 2-sentence luxury editorial description.',
      prompt: `Write trilingual showcase descriptions for:\nTitle: ${title || 'Untitled Campaign'}\nCategory: ${category}\nContext: ${context || 'Luxury AI-native film & commercial visual direction.'}`,
      responseMimeType: 'application/json',
    });

    let parsed;
    try {
      parsed = JSON.parse(raw.replace(/^```json\s*/i, '').replace(/```$/i, '').trim());
    } catch (_) {
      parsed = { en: raw, ar: '', fr: '' };
    }

    return res.status(200).json({
      ok: true,
      en: parsed.en || '',
      ar: parsed.ar || '',
      fr: parsed.fr || '',
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ error: err.message });
  }
};
