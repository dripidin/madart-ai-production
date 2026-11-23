const { requireAdmin, handlePreflight, getRequestBody } = require('./_lib/auth');
const { readJson, writeJson } = require('./_lib/storage');
const { dispatchNotification } = require('./_lib/notify');

const INVOICES_FILE = 'invoices.json';
const VALID_STATUSES = ['Draft', 'Sent', 'Paid', 'Cancelled'];
const VALID_CURRENCIES = ['USD', 'EUR', 'GBP', 'AED', 'DZD'];

function roundMoney(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

function normalizeLineItems(rawItems, fallbackDesc, fallbackAmount) {
  if (Array.isArray(rawItems) && rawItems.length > 0) {
    return rawItems.map((it, idx) => {
      const qty = Math.max(0, Number(it.qty ?? 1) || 0);
      const unitPrice = Math.max(0, Number(it.unitPrice ?? it.price ?? 0) || 0);
      return {
        id: it.id || `li_${Date.now()}_${idx}`,
        title: String(it.title || it.description || 'Production Deliverable').trim(),
        description: String(it.description || '').trim(),
        qty,
        unitPrice: roundMoney(unitPrice),
        total: roundMoney(qty * unitPrice),
      };
    });
  }
  const amt = Math.max(0, roundMoney(fallbackAmount));
  return [
    {
      id: `li_${Date.now()}_0`,
      title: String(fallbackDesc || 'AI Commercial Production').trim(),
      description: '',
      qty: 1,
      unitPrice: amt,
      total: amt,
    },
  ];
}

function isInvoiceOverdue(inv) {
  if (!inv || inv.status === 'Paid' || inv.status === 'Cancelled' || !inv.dueDate) return false;
  const dueTs = new Date(inv.dueDate).getTime();
  if (Number.isNaN(dueTs)) return false;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  return dueTs < todayStart.getTime();
}

function normalizeInvoiceRecord(raw, existingCount = 0) {
  const clientName = String(raw.clientName || '').trim();
  const baseDesc = String(raw.description || '').trim();
  const hasExplicitItems = Array.isArray(raw.items) && raw.items.length > 0;
  const items = normalizeLineItems(
    raw.items,
    baseDesc || 'AI Commercial Production',
    raw.amount ?? 0
  );

  const subtotal = hasExplicitItems
    ? roundMoney(items.reduce((acc, it) => acc + it.total, 0))
    : roundMoney(raw.subtotal ?? raw.amount ?? 0);
  const taxRate = Math.min(100, Math.max(0, Number(raw.taxRate ?? 0) || 0));
  const taxAmount = roundMoney(subtotal * (taxRate / 100));
  const discountAmount = Math.max(0, roundMoney(raw.discountAmount ?? 0));
  const computedTotal = Math.max(0, roundMoney(subtotal + taxAmount - discountAmount));
  const finalAmount =
    hasExplicitItems || raw.taxRate !== undefined || raw.discountAmount !== undefined
      ? computedTotal
      : roundMoney(raw.amount ?? computedTotal);

  const status = VALID_STATUSES.includes(raw.status) ? raw.status : 'Draft';
  const currency = VALID_CURRENCIES.includes(raw.currency) ? raw.currency : 'USD';
  const descriptionSummary =
    baseDesc ||
    items.map((it) => it.title).filter(Boolean).slice(0, 3).join(', ') ||
    'AI Commercial Production';

  return {
    id: raw.id || `inv_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
    invoiceNumber:
      raw.invoiceNumber || `MA-${new Date().getFullYear()}-${String(existingCount + 101)}`,
    fromName: String(raw.fromName || 'MadeArt AI Studio').trim(),
    fromEmail: String(raw.fromEmail || 'hello@madeartagency.com').trim(),
    fromAddress: String(raw.fromAddress || 'Creative AI Production Agency').trim(),
    clientName,
    clientCompany: String(raw.clientCompany || '').trim(),
    clientEmail: String(raw.clientEmail || '').trim(),
    clientAddress: String(raw.clientAddress || '').trim(),
    description: descriptionSummary,
    items,
    subtotal,
    taxRate,
    taxAmount,
    discountAmount,
    amount: finalAmount,
    currency,
    issueDate: raw.issueDate || (raw.createdAt ? String(raw.createdAt).slice(0, 10) : new Date().toISOString().slice(0, 10)),
    dueDate: raw.dueDate || '',
    paymentTerms: String(raw.paymentTerms || 'Upon Receipt').trim(),
    notes: String(raw.notes || '').trim(),
    status,
    paidAt: status === 'Paid' ? raw.paidAt || new Date().toISOString() : undefined,
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || undefined,
  };
}

function buildSummary(invoices) {
  let totalPaid = 0;
  let totalPending = 0;
  let totalOverdue = 0;
  let totalDraft = 0;
  let paidCount = 0;
  let sentCount = 0;
  let draftCount = 0;
  let overdueCount = 0;
  let cancelledCount = 0;

  for (const inv of invoices) {
    const amt = Number(inv.amount || 0);
    const overdue = isInvoiceOverdue(inv);
    if (inv.status === 'Paid') {
      totalPaid += amt;
      paidCount += 1;
    } else if (inv.status === 'Cancelled') {
      cancelledCount += 1;
    } else {
      totalPending += amt;
      if (inv.status === 'Sent') sentCount += 1;
      if (inv.status === 'Draft') draftCount += 1;
      if (overdue) {
        totalOverdue += amt;
        overdueCount += 1;
      } else if (inv.status === 'Draft') {
        totalDraft += amt;
      }
    }
  }

  return {
    totalPaid: roundMoney(totalPaid),
    totalPending: roundMoney(totalPending),
    totalOverdue: roundMoney(totalOverdue),
    totalDraft: roundMoney(totalDraft),
    totalRevenue: roundMoney(totalPaid + totalPending),
    count: invoices.length,
    paidCount,
    sentCount,
    draftCount,
    overdueCount,
    cancelledCount,
  };
}

module.exports = async (req, res) => {
  if (handlePreflight(req, res, 'GET,POST,PATCH,DELETE,OPTIONS')) return;
  if (!requireAdmin(req, res)) return;

  const rawList = readJson(INVOICES_FILE, []);
  const invoices = (Array.isArray(rawList) ? rawList : []).map((inv, idx, arr) => ({
    ...normalizeInvoiceRecord(inv, arr.length - idx),
    isOverdue: isInvoiceOverdue(inv),
  }));

  if (req.method === 'GET') {
    return res.status(200).json({
      invoices,
      summary: buildSummary(invoices),
    });
  }

  if (req.method === 'POST') {
    const body = getRequestBody(req);
    const clientName = String(body.clientName || '').trim();
    const hasItems = Array.isArray(body.items) && body.items.length > 0;
    const rawAmount = Number(body.amount);

    if (!clientName) {
      return res.status(400).json({ error: 'Client name is required.' });
    }
    if (!hasItems && (Number.isNaN(rawAmount) || rawAmount < 0)) {
      return res.status(400).json({ error: 'Provide either line items or a valid amount.' });
    }

    const invoice = normalizeInvoiceRecord(body, invoices.length);
    invoices.unshift({ ...invoice, isOverdue: isInvoiceOverdue(invoice) });
    writeJson(INVOICES_FILE, invoices.map(({ isOverdue, ...rest }) => rest));
    await dispatchNotification('invoice_created', invoice);

    return res.status(201).json({
      ok: true,
      invoice: { ...invoice, isOverdue: isInvoiceOverdue(invoice) },
    });
  }

  if (req.method === 'PATCH') {
    const body = getRequestBody(req);

    if (body.action === 'bulk_status' && Array.isArray(body.ids)) {
      const nextStatus = VALID_STATUSES.includes(body.status) ? body.status : null;
      if (!nextStatus) return res.status(400).json({ error: 'Invalid status value.' });
      const idSet = new Set(body.ids.map(String));
      let updatedCount = 0;
      const nextList = invoices.map((inv) => {
        if (!idSet.has(inv.id)) return inv;
        updatedCount += 1;
        return {
          ...inv,
          status: nextStatus,
          paidAt: nextStatus === 'Paid' ? inv.paidAt || new Date().toISOString() : undefined,
          updatedAt: new Date().toISOString(),
        };
      });
      writeJson(INVOICES_FILE, nextList.map(({ isOverdue, ...rest }) => rest));
      return res.status(200).json({ ok: true, updatedCount });
    }

    const id = body.id || req.query?.id;
    if (!id) return res.status(400).json({ error: 'Invoice ID is required.' });
    const idx = invoices.findIndex((i) => i.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Invoice not found.' });

    const merged = normalizeInvoiceRecord(
      { ...invoices[idx], ...body, id, updatedAt: new Date().toISOString() },
      invoices.length
    );
    invoices[idx] = { ...merged, isOverdue: isInvoiceOverdue(merged) };
    writeJson(INVOICES_FILE, invoices.map(({ isOverdue, ...rest }) => rest));
    return res.status(200).json({ ok: true, invoice: invoices[idx] });
  }

  if (req.method === 'DELETE') {
    const body = getRequestBody(req);
    const idsParam = req.query?.ids ? String(req.query.ids).split(',') : null;
    const bulkIds = Array.isArray(body.ids) ? body.ids : idsParam;
    if (bulkIds && bulkIds.length > 0) {
      const idSet = new Set(bulkIds.map(String));
      const next = invoices.filter((i) => !idSet.has(i.id));
      writeJson(INVOICES_FILE, next.map(({ isOverdue, ...rest }) => rest));
      return res.status(200).json({ ok: true, deletedCount: invoices.length - next.length });
    }

    const id = req.query?.id || body.id;
    if (!id) return res.status(400).json({ error: 'Invoice ID is required.' });
    const next = invoices.filter((i) => i.id !== id);
    writeJson(INVOICES_FILE, next.map(({ isOverdue, ...rest }) => rest));
    return res.status(200).json({ ok: true, id });
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
};
