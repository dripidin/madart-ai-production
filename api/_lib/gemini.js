const { readSecrets } = require('./storage');

async function callGemini({ prompt, systemInstruction = '', responseMimeType = 'text/plain', model = 'gemini-2.5-flash' }) {
  const secrets = readSecrets();
  const apiKey = secrets.gemini?.apiKey;
  if (!secrets.gemini?.enabled || !apiKey) {
    const err = new Error('Gemini API is not enabled or missing API key. Configure it in Settings → Integrations.');
    err.statusCode = 400;
    throw err;
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const payload = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      responseMimeType,
    },
  };

  if (systemInstruction) {
    payload.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  const resp = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => '');
    const err = new Error(`Gemini API returned ${resp.status}: ${errText.slice(0, 220)}`);
    err.statusCode = 502;
    throw err;
  }

  const data = await resp.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';
  if (!text) {
    const err = new Error('Gemini API returned an empty response.');
    err.statusCode = 502;
    throw err;
  }
  return text.trim();
}

module.exports = { callGemini };
