export type InvoiceStatus = "Draft" | "Sent" | "Paid" | "Cancelled";
export type InvoiceCurrency = "USD" | "EUR" | "GBP" | "AED" | "DZD";

export interface InvoiceLineItem {
  id: string;
  title: string;
  description: string;
  qty: number;
  unitPrice: number;
  total: number;
}

export interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  fromName: string;
  fromEmail: string;
  fromAddress: string;
  clientName: string;
  clientCompany: string;
  clientEmail: string;
  clientAddress: string;
  description: string;
  items: InvoiceLineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  amount: number;
  currency: InvoiceCurrency | string;
  issueDate: string;
  dueDate: string;
  paymentTerms: string;
  notes: string;
  status: InvoiceStatus;
  isOverdue?: boolean;
  paidAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface InvoiceSummary {
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
  totalDraft: number;
  totalRevenue: number;
  count: number;
  paidCount: number;
  sentCount: number;
  draftCount: number;
  overdueCount: number;
  cancelledCount: number;
}

export const CURRENCIES: InvoiceCurrency[] = ["USD", "EUR", "GBP", "AED", "DZD"];

export const PAYMENT_TERMS_OPTIONS = [
  "Upon Receipt",
  "Net 7",
  "Net 15",
  "Net 30",
  "50% Deposit / 50% Delivery",
];

export function formatMoney(amount: number, currency = "USD"): string {
  const num = Number(amount || 0);
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(num);
  } catch {
    return `${currency} ${num.toLocaleString()}`;
  }
}

export function getInitials(name: string): string {
  const parts = String(name || "CL")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return (parts[0] || "CL").slice(0, 2).toUpperCase();
}

export function getStatusBadgeColor(
  status: InvoiceStatus,
  isOverdue?: boolean
): "success" | "blue" | "warning" | "error" | "gray" {
  if (isOverdue && status !== "Paid" && status !== "Cancelled") return "error";
  if (status === "Paid") return "success";
  if (status === "Sent") return "blue";
  if (status === "Cancelled") return "gray";
  return "warning";
}
