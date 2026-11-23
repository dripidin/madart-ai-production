"use client";

import { MadeArtLogoWithText } from "@/components/common/madeart-logo";
import { Avatar, AvatarFallback } from "@/components/tailgrids/core/avatar";
import { Badge } from "@/components/tailgrids/core/badge";
import { Button } from "@/components/tailgrids/core/button";
import { ButtonGroup } from "@/components/tailgrids/core/button-group";
import {
  Dialog,
  DialogBody,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/tailgrids/core/dialog";
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
import {
  formatMoney,
  getInitials,
  getStatusBadgeColor,
  type InvoiceRecord,
  type InvoiceStatus,
} from "./types";

interface InvoicePreviewModalProps {
  invoice: InvoiceRecord | null;
  onClose: () => void;
  onEdit: (inv: InvoiceRecord) => void;
  onDuplicate: (inv: InvoiceRecord) => void;
  onStatusChange: (id: string, status: InvoiceStatus) => void;
}

export function InvoicePreviewModal({
  invoice,
  onClose,
  onEdit,
  onDuplicate,
  onStatusChange,
}: InvoicePreviewModalProps) {
  if (!invoice) return null;

  const printInvoiceSheet = () => {
    const esc = (s: unknown) =>
      String(s ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

    const rowsHtml = invoice.items
      .map(
        (it, idx) => `
      <tr>
        <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;">${idx + 1}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;">
          <strong>${esc(it.title)}</strong>
          ${it.description ? `<div style="font-size:12px;color:#6b7280;margin-top:2px;">${esc(it.description)}</div>` : ""}
        </td>
        <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;text-align:right;">${it.qty}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;text-align:right;">${esc(formatMoney(it.unitPrice, invoice.currency))}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600;">${esc(formatMoney(it.total, invoice.currency))}</td>
      </tr>`
      )
      .join("");

    const win = window.open("", "_blank", "width=900,height=750");
    if (!win) return;
    win.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>Invoice ${esc(invoice.invoiceNumber)} — ${esc(invoice.clientName)}</title>
<style>
  body { font-family: Inter, system-ui, -apple-system, sans-serif; color: #111827; padding: 40px; max-width: 820px; margin: 0 auto; }
  .top { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #111827; padding-bottom: 20px; margin-bottom: 24px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px; font-size: 13px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 24px; }
  th { text-align: left; font-size: 11px; text-transform: uppercase; color: #6b7280; padding: 10px 8px; border-bottom: 1px solid #d1d5db; }
  .totals { margin-left: auto; width: 280px; font-size: 13px; }
  .totals .row { display: flex; justify-content: space-between; padding: 6px 0; }
  .totals .grand { border-top: 2px solid #111827; margin-top: 8px; padding-top: 10px; font-size: 16px; font-weight: 700; }
  .notes { margin-top: 30px; padding: 14px; background: #f9fafb; border-radius: 8px; font-size: 12px; color: #4b5563; }
</style>
</head>
<body>
  <div class="top">
    <div>
      <h1 style="margin:0;font-size:24px;letter-spacing:-0.02em;">${esc(invoice.fromName || "MadeArt AI Studio")}</h1>
      <p style="margin:4px 0 0;font-size:13px;color:#6b7280;">${esc(invoice.fromEmail || "hello@madeartagency.com")}</p>
      <p style="margin:2px 0 0;font-size:12px;color:#6b7280;">${esc(invoice.fromAddress || "")}</p>
    </div>
    <div style="text-align:right;">
      <div style="font-size:11px;text-transform:uppercase;color:#6b7280;">INVOICE</div>
      <div style="font-size:20px;font-weight:700;">${esc(invoice.invoiceNumber)}</div>
      <div style="margin-top:4px;font-size:12px;">Status: <strong>${esc(invoice.status)}</strong></div>
    </div>
  </div>
  <div class="grid">
    <div>
      <div style="font-size:11px;text-transform:uppercase;color:#6b7280;margin-bottom:4px;">Bill To</div>
      <strong>${esc(invoice.clientName)}</strong>
      ${invoice.clientCompany ? `<div>${esc(invoice.clientCompany)}</div>` : ""}
      ${invoice.clientEmail ? `<div>${esc(invoice.clientEmail)}</div>` : ""}
      ${invoice.clientAddress ? `<div>${esc(invoice.clientAddress)}</div>` : ""}
    </div>
    <div style="text-align:right;">
      <div>Issue Date: <strong>${esc(invoice.issueDate || invoice.createdAt.slice(0, 10))}</strong></div>
      <div>Due Date: <strong>${esc(invoice.dueDate || "Upon Receipt")}</strong></div>
      <div>Terms: <strong>${esc(invoice.paymentTerms || "Upon Receipt")}</strong></div>
      <div>Currency: <strong>${esc(invoice.currency)}</strong></div>
    </div>
  </div>
  <table>
    <thead>
      <tr>
        <th style="width:40px;">#</th>
        <th>Deliverable</th>
        <th style="text-align:right;">Qty</th>
        <th style="text-align:right;">Unit Price</th>
        <th style="text-align:right;">Amount</th>
      </tr>
    </thead>
    <tbody>${rowsHtml}</tbody>
  </table>
  <div class="totals">
    <div class="row"><span>Subtotal</span><span>${esc(formatMoney(invoice.subtotal, invoice.currency))}</span></div>
    ${invoice.taxRate ? `<div class="row"><span>Tax (${esc(invoice.taxRate)}%)</span><span>${esc(formatMoney(invoice.taxAmount, invoice.currency))}</span></div>` : ""}
    ${invoice.discountAmount ? `<div class="row"><span>Discount</span><span>-${esc(formatMoney(invoice.discountAmount, invoice.currency))}</span></div>` : ""}
    <div class="row grand"><span>Total Due</span><span>${esc(formatMoney(invoice.amount, invoice.currency))}</span></div>
  </div>
  ${invoice.notes ? `<div class="notes"><strong>Payment Instructions & Notes</strong><p style="margin:6px 0 0;">${esc(invoice.notes)}</p></div>` : ""}
  <script>window.onload = () => { window.print(); };</script>
</body>
</html>`);
    win.document.close();
  };

  const mailtoHref = invoice.clientEmail
    ? `mailto:${encodeURIComponent(invoice.clientEmail)}?subject=${encodeURIComponent(
        `Invoice ${invoice.invoiceNumber} from ${invoice.fromName || "MadeArt AI Studio"}`
      )}&body=${encodeURIComponent(
        `Hello ${invoice.clientName},\n\nPlease find your invoice summary for ${invoice.description}:\nInvoice Number: ${invoice.invoiceNumber}\nTotal Due: ${formatMoney(invoice.amount, invoice.currency)}\nDue Date: ${invoice.dueDate || invoice.paymentTerms}\n\n${invoice.notes || "Thank you for your business."}\n\nBest regards,\n${invoice.fromName || "MadeArt AI Studio"}`
      )}`
    : null;

  return (
    <Backdrop isOpen={Boolean(invoice)} onOpenChange={(open) => !open && onClose()}>
      <Dialog className="max-h-[92vh] max-w-3xl overflow-y-auto p-6">
        <DialogHeader className="border-b border-card-border pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pr-8">
            <MadeArtLogoWithText />
            <div className="flex items-center gap-2">
              <Badge
                color={getStatusBadgeColor(invoice.status, invoice.isOverdue)}
                size="md"
              >
                {invoice.isOverdue && invoice.status !== "Paid"
                  ? "Overdue"
                  : invoice.status}
              </Badge>
              <DialogTitle className="font-mono text-base">
                {invoice.invoiceNumber}
              </DialogTitle>
            </div>
          </div>
        </DialogHeader>

        <DialogBody className="space-y-6">
          {/* From / Bill To / Dates */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="space-y-1 text-xs">
              <p className="font-semibold text-text-tertiary uppercase">From</p>
              <p className="text-sm font-semibold text-text-primary">
                {invoice.fromName || "MadeArt AI Studio"}
              </p>
              <p className="text-text-secondary">{invoice.fromEmail}</p>
              {invoice.fromAddress && (
                <p className="text-text-tertiary">{invoice.fromAddress}</p>
              )}
            </div>

            <div className="space-y-1 text-xs">
              <p className="font-semibold text-text-tertiary uppercase">Bill To</p>
              <div className="flex items-center gap-2 pt-0.5">
                <Avatar size="sm">
                  <AvatarFallback>{getInitials(invoice.clientName)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold text-text-primary">
                    {invoice.clientName}
                  </p>
                  {invoice.clientCompany && (
                    <p className="text-text-secondary">{invoice.clientCompany}</p>
                  )}
                </div>
              </div>
              {invoice.clientEmail && (
                <p className="text-text-secondary">{invoice.clientEmail}</p>
              )}
              {invoice.clientAddress && (
                <p className="text-text-tertiary">{invoice.clientAddress}</p>
              )}
            </div>

            <div className="space-y-1.5 rounded-xl border border-card-border bg-background-soft-50 p-3 text-xs">
              <div className="flex justify-between">
                <span className="text-text-tertiary">Issue Date</span>
                <span className="font-medium text-text-primary">
                  {invoice.issueDate || invoice.createdAt.slice(0, 10)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-tertiary">Due Date</span>
                <span className="font-medium text-text-primary">
                  {invoice.dueDate || "Upon Receipt"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-tertiary">Terms</span>
                <span className="font-medium text-text-primary">
                  {invoice.paymentTerms || "Upon Receipt"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-tertiary">Currency</span>
                <span className="font-medium text-text-primary">{invoice.currency}</span>
              </div>
            </div>
          </div>

          {/* Itemized Breakdown Table */}
          <div className="overflow-hidden rounded-xl border border-card-border">
            <TableRoot className="rounded-none border-none">
              <TableHeader className="bg-background-soft-100">
                <TableRow>
                  <TableHead className="px-4 py-2.5">#</TableHead>
                  <TableHead className="px-4 py-2.5">Deliverable</TableHead>
                  <TableHead className="px-4 py-2.5 text-right">Qty</TableHead>
                  <TableHead className="px-4 py-2.5 text-right">Unit Price</TableHead>
                  <TableHead className="px-4 py-2.5 text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.items.map((it, idx) => (
                  <TableRow key={it.id || idx}>
                    <TableCell className="px-4 py-3 text-xs text-text-tertiary">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <p className="text-sm font-medium text-text-primary">{it.title}</p>
                      {it.description && (
                        <p className="text-xs text-text-tertiary">{it.description}</p>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right text-sm text-text-secondary">
                      {it.qty}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right text-sm text-text-secondary">
                      {formatMoney(it.unitPrice, invoice.currency)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right text-sm font-semibold text-text-primary">
                      {formatMoney(it.total, invoice.currency)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </TableRoot>
          </div>

          {/* Financial Totals & Notes */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
            <div className="md:col-span-7">
              {invoice.notes && (
                <div className="rounded-xl border border-card-border bg-background-soft-50 p-4 text-xs">
                  <p className="font-semibold text-text-tertiary uppercase">
                    Payment Instructions & Notes
                  </p>
                  <p className="mt-1.5 whitespace-pre-wrap text-text-secondary">
                    {invoice.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2 text-sm md:col-span-5">
              <div className="flex justify-between">
                <span className="text-text-tertiary">Subtotal</span>
                <span className="font-medium text-text-primary">
                  {formatMoney(invoice.subtotal, invoice.currency)}
                </span>
              </div>
              {Number(invoice.taxRate) > 0 && (
                <div className="flex justify-between">
                  <span className="text-text-tertiary">Tax ({invoice.taxRate}%)</span>
                  <span className="font-medium text-text-primary">
                    {formatMoney(invoice.taxAmount, invoice.currency)}
                  </span>
                </div>
              )}
              {Number(invoice.discountAmount) > 0 && (
                <div className="flex justify-between text-success-600">
                  <span>Discount</span>
                  <span>-{formatMoney(invoice.discountAmount, invoice.currency)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-base font-bold text-text-primary">
                <span>Total Due</span>
                <span>{formatMoney(invoice.amount, invoice.currency)}</span>
              </div>
            </div>
          </div>
        </DialogBody>

        <DialogFooter className="flex flex-wrap items-center justify-between gap-3 border-t border-card-border pt-4">
          <ButtonGroup size="sm">
            <button type="button" onClick={printInvoiceSheet}>
              Print / Save PDF
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(invoice);
              }}
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onDuplicate(invoice);
              }}
            >
              Duplicate
            </button>
          </ButtonGroup>

          <div className="flex flex-wrap items-center gap-2">
            {mailtoHref && (
              <a
                href={mailtoHref}
                className="inline-flex h-8 items-center rounded-lg border border-card-border px-3 text-xs font-medium text-text-primary hover:bg-background-soft-100"
              >
                Email Client (mailto:)
              </a>
            )}
            {invoice.status !== "Paid" && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onPress={() => onStatusChange(invoice.id, "Paid")}
              >
                Mark Paid
              </Button>
            )}
            <Button
              type="button"
              appearance="outline"
              size="sm"
              onPress={onClose}
              className="border px-3 py-1.5"
            >
              Close
            </Button>
          </div>
        </DialogFooter>
      </Dialog>
    </Backdrop>
  );
}
