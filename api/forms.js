const { requireAdmin, handlePreflight, getRequestBody } = require('./_lib/auth');
const { readJson, writeJson } = require('./_lib/storage');

const FORMS_FILE = 'forms.json';
const VALID_TYPES = new Set(['text', 'email', 'select', 'textarea']);

module.exports = async (req, res) => {
  if (handlePreflight(req, res, 'GET,POST,OPTIONS')) return;

  const forms = readJson(FORMS_FILE, {});

  if (req.method === 'GET') {
    const formId = (req.query?.formId || '').trim();
    if (formId) {
      return res.status(200).json({ formId, fields: forms[formId] || [] });
    }
    return res.status(200).json(forms);
  }

  if (!requireAdmin(req, res)) return;

  if (req.method === 'POST') {
    const body = getRequestBody(req);
    const formId = String(body.formId || '').trim().replace(/[^a-z0-9-_]/gi, '');
    if (!formId || !Array.isArray(body.fields)) {
      return res.status(400).json({ error: 'formId and fields array are required.' });
    }

    const sanitizedFields = body.fields.map((f, idx) => ({
      id: String(f.id || f.name || `field_${idx + 1}`).trim(),
      name: String(f.name || f.id || `field_${idx + 1}`).trim(),
      label: String(f.label || `Field ${idx + 1}`).trim(),
      type: VALID_TYPES.has(f.type) ? f.type : 'text',
      required: Boolean(f.required),
      placeholder: String(f.placeholder || '').trim(),
      errorMessage: String(f.errorMessage || '').trim(),
      options:
        f.type === 'select' && Array.isArray(f.options)
          ? f.options.map((opt) =>
              typeof opt === 'string'
                ? { value: opt.toLowerCase().replace(/\s+/g, '-'), label: opt }
                : {
                    value: String(opt.value || opt.label || '').trim(),
                    label: String(opt.label || opt.value || '').trim(),
                  }
            )
          : undefined,
    }));

    const updated = { ...forms, [formId]: sanitizedFields };
    const wr = writeJson(FORMS_FILE, updated);
    return res.status(200).json({ ok: true, formId, fields: sanitizedFields, persisted: wr.persisted });
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
};
