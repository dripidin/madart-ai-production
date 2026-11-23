"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/tailgrids/core/button";
import {
  Dialog,
  DialogBody,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/tailgrids/core/dialog";
import { Input } from "@/components/tailgrids/core/input";
import { Backdrop } from "@/components/tailgrids/core/overlay";
import { Separator } from "@/components/tailgrids/core/separator";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRoot,
  TableRow,
} from "@/components/tailgrids/core/table";
import { TextArea } from "@/components/tailgrids/core/text-area";
import {
  CURRENCIES,
  formatMoney,
  PAYMENT_TERMS_OPTIONS,
  type InvoiceCurrency,
  type InvoiceLineItem,
  type InvoiceRecord,
  type InvoiceStatus,
} from "./types";

interface InvoiceFormModalProps {
  isOpen: boolean;
  mode: "create" | "edit" | "duplicate";
  initialInvoice: InvoiceRecord | null;
  onClose: () => void;
  onSaved: () => void;
}

function emptyItem(idx = 0): InvoiceLineItem {
  return {
    id: `li_${Date.now()}_${idx}`,
    title: "",
    description: "",
    qty: 1,
    unitPrice: 0,
    total: 0,
  };
}

export function InvoiceFormModal(props: InvoiceFormModalProps) {
  if (!props.isOpen) return null;
  const modalKey = `${props.mode}-${props.initialInvoice?.id ?? "new"}`;
  return <InvoiceFormModalInner key={modalKey} {...props} />;
}

function InvoiceFormModalInner({
  isOpen,
  mode,
  initialInvoice,
  onClose,
  onSaved,
}: InvoiceFormModalProps) {
  const isPrefilled = Boolean(initialInvoice && (mode === "edit" || mode === "duplicate"));
  const [invoiceNumber, setInvoiceNumber] = useState(
    isPrefilled && mode === "edit" ? initialInvoice!.invoiceNumber : ""
  );
  const [fromName, setFromName] = useState(
    isPrefilled ? initialInvoice!.fromName || "MadeArt AI Studio" : "MadeArt AI Studio"
  );
  const [fromEmail, setFromEmail] = useState(
    isPrefilled
      ? initialInvoice!.fromEmail || "hello@madeartagency.com"
      : "hello@madeartagency.com"
  );
  const [fromAddress, setFromAddress] = useState(
    isPrefilled
      ? initialInvoice!.fromAddress || "Creative AI Production Agency"
      : "Creative AI Production Agency"
  );

  const [clientName, setClientName] = useState(
    isPrefilled ? initialInvoice!.clientName || "" : ""
  );
  const [clientCompany, setClientCompany] = useState(
    isPrefilled ? initialInvoice!.clientCompany || "" : ""
  );
  const [clientEmail, setClientEmail] = useState(
    isPrefilled ? initialInvoice!.clientEmail || "" : ""
  );
  const [clientAddress, setClientAddress] = useState(
    isPrefilled ? initialInvoice!.clientAddress || "" : ""
  );

  const [currency, setCurrency] = useState<InvoiceCurrency>(
    isPrefilled ? (initialInvoice!.currency as InvoiceCurrency) || "USD" : "USD"
  );
  const [issueDate, setIssueDate] = useState(() => {
    const today = new Date().toISOString().slice(0, 10);
    return isPrefilled && mode !== "duplicate"
      ? initialInvoice!.issueDate || today
      : today;
  });
  const [dueDate, setDueDate] = useState(
    isPrefilled ? initialInvoice!.dueDate || "" : ""
  );
  const [paymentTerms, setPaymentTerms] = useState(
    isPrefilled
      ? initialInvoice!.paymentTerms || PAYMENT_TERMS_OPTIONS[0]
      : PAYMENT_TERMS_OPTIONS[0]
  );
  const [status, setStatus] = useState<InvoiceStatus>(
    isPrefilled && mode !== "duplicate" ? initialInvoice!.status || "Draft" : "Draft"
  );

  const [items, setItems] = useState<InvoiceLineItem[]>(() =>
    isPrefilled
      ? Array.isArray(initialInvoice!.items) && initialInvoice!.items.length > 0
        ? initialInvoice!.items.map((it, i) => ({
            ...it,
            id: it.id || `li_${i + 1}`,
          }))
        : [
            {
              id: "li_0",
              title: initialInvoice!.description || "AI Commercial Production",
              description: "",
              qty: 1,
              unitPrice: Number(initialInvoice!.amount || 0),
              total: Number(initialInvoice!.amount || 0),
            },
          ]
      : [emptyItem(0)]
  );
  const [taxRate, setTaxRate] = useState<number>(
    isPrefilled ? Number(initialInvoice!.taxRate || 0) : 0
  );
  const [discountAmount, setDiscountAmount] = useState<number>(
    isPrefilled ? Number(initialInvoice!.discountAmount || 0) : 0
  );
  const [notes, setNotes] = useState(
    isPrefilled
      ? initialInvoice!.notes || ""
      : "Thank you for collaborating with MadeArt AI Studio."
  );
  const [saving, setSaving] = useState(false);

  const totals = useMemo(() => {
    const subtotal = items.reduce(
      (acc, it) => acc + (Number(it.qty) || 0) * (Number(it.unitPrice) || 0),
      0
    );
    const taxAmount = subtotal * ((Number(taxRate) || 0) / 100);
    const total = Math.max(0, subtotal + taxAmount - (Number(discountAmount) || 0));
    return { subtotal, taxAmount, total };
  }, [items, taxRate, discountAmount]);

  const updateItem = (idx: number, patch: Partial<InvoiceLineItem>) => {
    setItems((prev) =>
      prev.map((it, i) => {
        if (i !== idx) return it;
        const next = { ...it, ...patch };
        next.total = (Number(next.qty) || 0) * (Number(next.unitPrice) || 0);
        return next;
      })
    );
  };

  const addItem = () => {
    setItems((prev) => [...prev, emptyItem(prev.length)]);
  };

  const removeItem = (idx: number) => {
    setItems((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientName.trim()) {
      toast.error("Client name is required.");
      return;
    }
    const validItems = items
      .filter((it) => it.title.trim() || Number(it.unitPrice) > 0)
      .map((it) => ({
        ...it,
        title: it.title.trim() || "Production Deliverable",
        qty: Math.max(0, Number(it.qty) || 1),
        unitPrice: Math.max(0, Number(it.unitPrice) || 0),
      }));

    if (validItems.length === 0) {
      toast.error("Add at least one deliverable line item with a price.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...(mode === "edit" && initialInvoice ? { id: initialInvoice.id } : {}),
        ...(invoiceNumber.trim() ? { invoiceNumber: invoiceNumber.trim() } : {}),
        fromName: fromName.trim(),
        fromEmail: fromEmail.trim(),
        fromAddress: fromAddress.trim(),
        clientName: clientName.trim(),
        clientCompany: clientCompany.trim(),
        clientEmail: clientEmail.trim(),
        clientAddress: clientAddress.trim(),
        items: validItems,
        taxRate: Number(taxRate) || 0,
        discountAmount: Number(discountAmount) || 0,
        amount: totals.total,
        currency,
        issueDate,
        dueDate,
        paymentTerms,
        notes: notes.trim(),
        status,
      };

      const res = await fetch("/api/invoices", {
        method: mode === "edit" ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save invoice.");

      toast.success(
        mode === "edit"
          ? `Updated invoice ${data.invoice.invoiceNumber}.`
          : `Created invoice ${data.invoice.invoiceNumber}.`
      );
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed saving invoice.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Backdrop isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog className="max-h-[90vh] max-w-4xl overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit"
              ? `Edit Invoice ${initialInvoice?.invoiceNumber || ""}`
              : mode === "duplicate"
              ? "Duplicate Invoice"
              : "Create Studio Invoice"}
          </DialogTitle>
          <DialogDescription>
            Build itemized AI production billing with live tax, discount, and multi-currency totals.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <DialogBody className="space-y-6">
            {/* Invoice Metadata Row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div>
                <label className="mb-1 block text-xs font-medium text-text-primary">
                  Invoice # (Auto if blank)
                </label>
                <Input
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="MA-2026-102"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-text-primary">
                  Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as InvoiceCurrency)}
                  className="h-10 w-full rounded-lg border border-card-border bg-input-background px-3 text-sm text-text-primary"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-text-primary">
                  Issue Date
                </label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="h-10 w-full rounded-lg border border-card-border bg-input-background px-3 text-sm text-text-primary"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-text-primary">
                  Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="h-10 w-full rounded-lg border border-card-border bg-input-background px-3 text-sm text-text-primary"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-text-primary">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as InvoiceStatus)}
                  className="h-10 w-full rounded-lg border border-card-border bg-input-background px-3 text-sm text-text-primary"
                >
                  <option value="Draft">Draft</option>
                  <option value="Sent">Sent</option>
                  <option value="Paid">Paid</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <Separator />

            {/* From & Bill To Columns */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-3 rounded-xl border border-card-border bg-background-soft-50 p-4">
                <p className="text-xs font-semibold text-text-tertiary uppercase">
                  Billing From (Studio)
                </p>
                <Input
                  value={fromName}
                  onChange={(e) => setFromName(e.target.value)}
                  placeholder="Studio Name"
                />
                <Input
                  type="email"
                  value={fromEmail}
                  onChange={(e) => setFromEmail(e.target.value)}
                  placeholder="Studio Billing Email"
                />
                <Input
                  value={fromAddress}
                  onChange={(e) => setFromAddress(e.target.value)}
                  placeholder="Studio Location / Tax ID"
                />
              </div>

              <div className="space-y-3 rounded-xl border border-card-border bg-background-soft-50 p-4">
                <p className="text-xs font-semibold text-text-tertiary uppercase">
                  Bill To (Client) *
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <Input
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Contact / Brand Name *"
                    required
                  />
                  <Input
                    value={clientCompany}
                    onChange={(e) => setClientCompany(e.target.value)}
                    placeholder="Company / Maison"
                  />
                </div>
                <Input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="finance@client.com"
                />
                <Input
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  placeholder="Client Billing Address / Country"
                />
              </div>
            </div>

            {/* Line Items Editor */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-text-primary">
                  Line Items & Deliverables
                </p>
                <Button
                  type="button"
                  appearance="outline"
                  size="xs"
                  onPress={addItem}
                  className="border px-3 py-1.5"
                >
                  + Add Line Item
                </Button>
              </div>

              <div className="overflow-hidden rounded-xl border border-card-border">
                <TableRoot className="rounded-none border-none">
                  <TableHeader className="bg-background-soft-100">
                    <TableRow>
                      <TableHead className="px-3 py-2">Deliverable / Item</TableHead>
                      <TableHead className="px-3 py-2">Notes</TableHead>
                      <TableHead className="w-24 px-3 py-2">Qty</TableHead>
                      <TableHead className="w-32 px-3 py-2">Unit Price</TableHead>
                      <TableHead className="w-28 px-3 py-2 text-right">Amount</TableHead>
                      <TableHead className="w-16 px-3 py-2 text-center">Del</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((it, idx) => (
                      <TableRow key={it.id}>
                        <TableCell className="px-2 py-2">
                          <Input
                            value={it.title}
                            onChange={(e) => updateItem(idx, { title: e.target.value })}
                            placeholder="4K AI Brand Film Direction"
                          />
                        </TableCell>
                        <TableCell className="px-2 py-2">
                          <Input
                            value={it.description}
                            onChange={(e) => updateItem(idx, { description: e.target.value })}
                            placeholder="30s Hero + 3 cutdowns"
                          />
                        </TableCell>
                        <TableCell className="px-2 py-2">
                          <Input
                            type="number"
                            min={0}
                            step="1"
                            value={String(it.qty)}
                            onChange={(e) =>
                              updateItem(idx, { qty: Math.max(0, Number(e.target.value)) })
                            }
                          />
                        </TableCell>
                        <TableCell className="px-2 py-2">
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            value={String(it.unitPrice)}
                            onChange={(e) =>
                              updateItem(idx, {
                                unitPrice: Math.max(0, Number(e.target.value)),
                              })
                            }
                          />
                        </TableCell>
                        <TableCell className="px-3 py-2 text-right font-semibold whitespace-nowrap text-text-primary">
                          {formatMoney((Number(it.qty) || 0) * (Number(it.unitPrice) || 0), currency)}
                        </TableCell>
                        <TableCell className="px-2 py-2 text-center">
                          <button
                            type="button"
                            disabled={items.length <= 1}
                            onClick={() => removeItem(idx)}
                            className="rounded px-2 py-1 text-xs text-error-500 disabled:opacity-30 hover:bg-error-50"
                            title="Remove line item"
                          >
                            ✕
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </TableRoot>
              </div>
            </div>

            {/* Terms, Notes & Financial Summary */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
              <div className="space-y-3 md:col-span-7">
                <div>
                  <label className="mb-1 block text-xs font-medium text-text-primary">
                    Payment Terms
                  </label>
                  <select
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    className="h-10 w-full rounded-lg border border-card-border bg-input-background px-3 text-sm text-text-primary"
                  >
                    {PAYMENT_TERMS_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-text-primary">
                    Notes / Wire / Payment Instructions
                  </label>
                  <TextArea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="IBAN / Wise / Stripe link instructions..."
                  />
                </div>
              </div>

              <div className="space-y-3 rounded-xl border border-card-border bg-background-soft-50 p-4 md:col-span-5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-tertiary">Subtotal</span>
                  <span className="font-medium text-text-primary">
                    {formatMoney(totals.subtotal, currency)}
                  </span>
                </div>

                <div className="grid grid-cols-2 items-center gap-2 text-sm">
                  <label className="text-text-tertiary">Tax / VAT (%)</label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step="0.5"
                    value={String(taxRate)}
                    onChange={(e) => setTaxRate(Math.max(0, Number(e.target.value)))}
                  />
                </div>

                <div className="grid grid-cols-2 items-center gap-2 text-sm">
                  <label className="text-text-tertiary">Discount ({currency})</label>
                  <Input
                    type="number"
                    min={0}
                    step="1"
                    value={String(discountAmount)}
                    onChange={(e) => setDiscountAmount(Math.max(0, Number(e.target.value)))}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between text-base font-bold text-text-primary">
                  <span>Total Due</span>
                  <span>{formatMoney(totals.total, currency)}</span>
                </div>
              </div>
            </div>
          </DialogBody>

          <DialogFooter className="border-t border-card-border pt-4">
            <Button
              type="button"
              appearance="outline"
              onPress={onClose}
              className="border px-4 py-2"
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isDisabled={saving}>
              {saving
                ? "Saving Invoice..."
                : mode === "edit"
                ? "Save Changes"
                : "Create Invoice"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </Backdrop>
  );
}
