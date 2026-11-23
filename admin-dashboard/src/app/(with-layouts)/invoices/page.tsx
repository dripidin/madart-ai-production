"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { SearchIcon } from "@/components/common/header/icons";
import { InvoiceFormModal } from "@/components/invoices/invoice-form-modal";
import { InvoicePreviewModal } from "@/components/invoices/invoice-preview-modal";
import { InvoiceStats } from "@/components/invoices/invoice-stats";
import {
  CURRENCIES,
  formatMoney,
  getInitials,
  getStatusBadgeColor,
  type InvoiceRecord,
  type InvoiceStatus,
  type InvoiceSummary,
} from "@/components/invoices/types";
import { Avatar, AvatarFallback } from "@/components/tailgrids/core/avatar";
import { Badge } from "@/components/tailgrids/core/badge";
import { Breadcrumbs } from "@/components/tailgrids/core/breadcrumbs";
import { Button } from "@/components/tailgrids/core/button";
import { ButtonGroup } from "@/components/tailgrids/core/button-group";
import { Card, CardHeader, CardTitle } from "@/components/tailgrids/core/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/tailgrids/core/dropdown";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/tailgrids/core/input-group";
import { Pagination } from "@/components/tailgrids/core/pagination";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRoot,
  TableRow,
} from "@/components/tailgrids/core/table";
import { TabContent, TabList, TabRoot, TabTrigger } from "@/components/tailgrids/core/tabs";
import { MenuDotsIcon } from "@/utils/icon";
import {
  DownloadIcon,
  EyeIcon,
  TrashBinIcon,
} from "@/app/(with-layouts)/tables/basic-tables/_component/package-table/icons";

const EMPTY_SUMMARY: InvoiceSummary = {
  totalPaid: 0,
  totalPending: 0,
  totalOverdue: 0,
  totalDraft: 0,
  totalRevenue: 0,
  count: 0,
  paidCount: 0,
  sentCount: 0,
  draftCount: 0,
  overdueCount: 0,
  cancelledCount: 0,
};

const PAGE_SIZE = 8;

type FilterTabKey = "All" | "Paid" | "Sent" | "Draft" | "Overdue" | "Cancelled";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [summary, setSummary] = useState<InvoiceSummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [currencyFilter, setCurrencyFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"newest" | "amount_desc" | "due_asc">("newest");
  const [pageByTab, setPageByTab] = useState<Record<string, number>>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [formModal, setFormModal] = useState<{
    isOpen: boolean;
    mode: "create" | "edit" | "duplicate";
    invoice: InvoiceRecord | null;
  }>({ isOpen: false, mode: "create", invoice: null });

  const [previewInvoice, setPreviewInvoice] = useState<InvoiceRecord | null>(null);

  const applyInvoicesPayload = (data: { invoices?: InvoiceRecord[]; summary?: InvoiceSummary }) => {
    setInvoices(Array.isArray(data.invoices) ? data.invoices : []);
    if (data.summary) setSummary(data.summary);
  };

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/invoices", { credentials: "include" });
      if (res.ok) applyInvoicesPayload(await res.json());
    } catch {
      toast.error("Failed to load studio invoices.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/invoices", { credentials: "include", signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && !controller.signal.aborted) applyInvoicesPayload(data);
      })
      .catch((err) => {
        if ((err as Error)?.name !== "AbortError") {
          toast.error("Failed to load studio invoices.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  const updateStatus = async (id: string, nextStatus: InvoiceStatus) => {
    try {
      const res = await fetch("/api/invoices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id, status: nextStatus }),
      });
      if (!res.ok) throw new Error("Status update failed.");
      toast.success(`Invoice marked ${nextStatus}.`);
      if (previewInvoice?.id === id) {
        const updated = await res.json();
        setPreviewInvoice(updated.invoice || null);
      }
      await loadInvoices();
    } catch {
      toast.error("Could not update invoice status.");
    }
  };

  const handleBulkStatus = async (nextStatus: InvoiceStatus) => {
    if (selectedIds.length === 0) return;
    try {
      const res = await fetch("/api/invoices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "bulk_status", ids: selectedIds, status: nextStatus }),
      });
      if (!res.ok) throw new Error("Bulk status failed.");
      toast.success(`Marked ${selectedIds.length} invoice(s) as ${nextStatus}.`);
      setSelectedIds([]);
      await loadInvoices();
    } catch {
      toast.error("Failed applying bulk update.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/invoices?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Delete failed.");
      setSelectedIds((prev) => prev.filter((x) => x !== id));
      toast.success("Invoice deleted.");
      await loadInvoices();
    } catch {
      toast.error("Could not delete invoice.");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    try {
      const res = await fetch("/api/invoices", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ids: selectedIds }),
      });
      if (!res.ok) throw new Error("Bulk delete failed.");
      toast.success(`Deleted ${selectedIds.length} selected invoice(s).`);
      setSelectedIds([]);
      await loadInvoices();
    } catch {
      toast.error("Failed deleting selected invoices.");
    }
  };

  const exportCsv = () => {
    const header = [
      "Invoice Number",
      "Client Name",
      "Company",
      "Email",
      "Scope",
      "Issue Date",
      "Due Date",
      "Currency",
      "Subtotal",
      "Tax %",
      "Discount",
      "Total",
      "Status",
    ];
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = invoices.map((inv) =>
      [
        inv.invoiceNumber,
        inv.clientName,
        inv.clientCompany,
        inv.clientEmail,
        inv.description,
        inv.issueDate,
        inv.dueDate,
        inv.currency,
        inv.subtotal,
        inv.taxRate,
        inv.discountAmount,
        inv.amount,
        inv.isOverdue && inv.status !== "Paid" ? "Overdue" : inv.status,
      ]
        .map(esc)
        .join(",")
    );
    const csv = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `madeart-invoices-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported invoice ledger to CSV.");
  };

  const baseFiltered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = invoices.filter((inv) => {
      const curOk = currencyFilter === "ALL" || inv.currency === currencyFilter;
      const qOk =
        !q ||
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.clientName.toLowerCase().includes(q) ||
        (inv.clientCompany || "").toLowerCase().includes(q) ||
        (inv.clientEmail || "").toLowerCase().includes(q) ||
        (inv.description || "").toLowerCase().includes(q);
      return curOk && qOk;
    });

    const sorted = [...list];
    if (sortBy === "amount_desc") {
      sorted.sort((a, b) => Number(b.amount) - Number(a.amount));
    } else if (sortBy === "due_asc") {
      sorted.sort((a, b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999"));
    } else {
      sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    return sorted;
  }, [invoices, search, currencyFilter, sortBy]);

  const filterForTab = (tab: FilterTabKey) => {
    if (tab === "All") return baseFiltered;
    if (tab === "Overdue") return baseFiltered.filter((i) => i.isOverdue);
    return baseFiltered.filter((i) => i.status === tab);
  };

  const toggleSelect = (id: string, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? (prev.includes(id) ? prev : [...prev, id]) : prev.filter((x) => x !== id)
    );
  };

  const renderLedgerTable = (tab: FilterTabKey) => {
    const rowsAll = filterForTab(tab);
    const currentPage = pageByTab[tab] || 1;
    const totalPages = Math.max(1, Math.ceil(rowsAll.length / PAGE_SIZE));
    const safePage = Math.min(currentPage, totalPages);
    const pageRows = rowsAll.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
    const allVisibleSelected =
      pageRows.length > 0 && pageRows.every((inv) => selectedIds.includes(inv.id));

    return (
      <div className="space-y-4">
        <div className="overflow-hidden">
          <TableRoot className="w-full min-w-[820px] rounded-none border-none">
            <TableHeader className="bg-background-gray-secondary_alt">
              <TableRow className="[&_th]:border-t">
                <TableHead className="w-10 px-4 py-2.5">
                  <input
                    type="checkbox"
                    aria-label="Select all visible invoices"
                    checked={allVisibleSelected}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      if (checked) {
                        const add = pageRows.map((r) => r.id);
                        setSelectedIds((prev) => Array.from(new Set([...prev, ...add])));
                      } else {
                        const rem = new Set(pageRows.map((r) => r.id));
                        setSelectedIds((prev) => prev.filter((id) => !rem.has(id)));
                      }
                    }}
                    className="size-4 cursor-pointer rounded border border-border-primary bg-checkbox-background accent-primary-500"
                  />
                </TableHead>
                <TableHead className="px-4 py-2.5 text-xs font-semibold text-text-secondary">
                  Invoice #
                </TableHead>
                <TableHead className="px-4 py-2.5 text-xs font-semibold text-text-secondary">
                  Client &amp; Scope
                </TableHead>
                <TableHead className="px-4 py-2.5 text-xs font-semibold text-text-secondary">
                  Issue / Due Date
                </TableHead>
                <TableHead className="px-4 py-2.5 text-xs font-semibold text-text-secondary">
                  Amount
                </TableHead>
                <TableHead className="px-4 py-2.5 text-xs font-semibold text-text-secondary">
                  Status
                </TableHead>
                <TableHead className="px-4 py-2.5 text-right text-xs font-semibold text-text-secondary">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading && rowsAll.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="px-6 py-12 text-center text-sm text-text-tertiary">
                    Loading studio invoice ledger...
                  </TableCell>
                </TableRow>
              ) : pageRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="px-6 py-12 text-center text-sm text-text-tertiary">
                    No invoices match the current filter.
                  </TableCell>
                </TableRow>
              ) : (
                pageRows.map((inv) => (
                  <TableRow key={inv.id} className="hover:bg-background-soft-100/40">
                    <TableCell className="px-4 py-3.5">
                      <input
                        type="checkbox"
                        aria-label={`Select invoice ${inv.invoiceNumber}`}
                        checked={selectedIds.includes(inv.id)}
                        onChange={(e) => toggleSelect(inv.id, e.target.checked)}
                        className="size-4 cursor-pointer rounded border border-border-primary bg-checkbox-background accent-primary-500"
                      />
                    </TableCell>

                    <TableCell className="px-4 py-3.5 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setPreviewInvoice(inv)}
                        className="font-mono text-xs font-semibold text-primary-500 hover:underline"
                      >
                        {inv.invoiceNumber}
                      </button>
                      <div className="mt-0.5 text-[11px] text-text-tertiary">
                        {inv.items.length} {inv.items.length === 1 ? "item" : "items"}
                      </div>
                    </TableCell>

                    <TableCell className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar size="sm">
                          <AvatarFallback>{getInitials(inv.clientName)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-text-primary">
                            {inv.clientName}
                            {inv.clientCompany && (
                              <span className="ml-1.5 text-xs font-normal text-text-tertiary">
                                · {inv.clientCompany}
                              </span>
                            )}
                          </div>
                          <div className="max-w-xs truncate text-xs text-text-tertiary">
                            {inv.description}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="px-4 py-3.5 text-xs whitespace-nowrap">
                      <div className="text-text-primary">
                        Issued {inv.issueDate || inv.createdAt.slice(0, 10)}
                      </div>
                      <div
                        className={
                          inv.isOverdue
                            ? "font-medium text-error-500"
                            : "text-text-tertiary"
                        }
                      >
                        {inv.dueDate ? `Due ${inv.dueDate}` : inv.paymentTerms || "Upon Receipt"}
                      </div>
                    </TableCell>

                    <TableCell className="px-4 py-3.5 whitespace-nowrap">
                      <div className="text-sm font-semibold text-text-primary">
                        {formatMoney(inv.amount, inv.currency)}
                      </div>
                      {(Number(inv.taxRate) > 0 || Number(inv.discountAmount) > 0) && (
                        <div className="text-[11px] text-text-tertiary">
                          {Number(inv.taxRate) > 0 ? `+${inv.taxRate}% tax ` : ""}
                          {Number(inv.discountAmount) > 0
                            ? `-${formatMoney(inv.discountAmount, inv.currency)}`
                            : ""}
                        </div>
                      )}
                    </TableCell>

                    <TableCell className="px-4 py-3.5">
                      <Badge
                        color={getStatusBadgeColor(inv.status, inv.isOverdue)}
                        size="sm"
                      >
                        {inv.isOverdue && inv.status !== "Paid"
                          ? "Overdue"
                          : inv.status}
                      </Badge>
                    </TableCell>

                    <TableCell className="px-4 py-3.5 text-right">
                      <div className="inline-flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setPreviewInvoice(inv)}
                          className="rounded p-1 text-icon-tertiary transition-colors hover:bg-background-soft-100 hover:text-primary-500"
                          title="Preview / Print Invoice"
                        >
                          <EyeIcon />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewInvoice(inv)}
                          className="rounded p-1 text-icon-tertiary transition-colors hover:bg-background-soft-100 hover:text-primary-500"
                          title="Download / Print PDF"
                        >
                          <DownloadIcon />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(inv.id)}
                          className="rounded p-1 text-icon-tertiary transition-colors hover:bg-error-50 hover:text-error-500"
                          title="Delete Invoice"
                        >
                          <TrashBinIcon />
                        </button>

                        <DropdownMenu>
                          <DropdownMenuTrigger
                            aria-label={`More actions for ${inv.invoiceNumber}`}
                            className="flex size-7 items-center justify-center rounded text-icon-tertiary hover:bg-background-soft-100 hover:text-text-primary"
                          >
                            <MenuDotsIcon className="size-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent placement="bottom end" className="p-1.5">
                            <DropdownMenuItem
                              onAction={() =>
                                setFormModal({
                                  isOpen: true,
                                  mode: "edit",
                                  invoice: inv,
                                })
                              }
                            >
                              Edit Invoice
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onAction={() =>
                                setFormModal({
                                  isOpen: true,
                                  mode: "duplicate",
                                  invoice: inv,
                                })
                              }
                            >
                              Duplicate as Draft
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="my-1" />
                            {inv.status !== "Paid" && (
                              <DropdownMenuItem
                                onAction={() => updateStatus(inv.id, "Paid")}
                              >
                                Mark as Paid
                              </DropdownMenuItem>
                            )}
                            {inv.status !== "Sent" && (
                              <DropdownMenuItem
                                onAction={() => updateStatus(inv.id, "Sent")}
                              >
                                Mark as Sent
                              </DropdownMenuItem>
                            )}
                            {inv.status !== "Cancelled" && (
                              <DropdownMenuItem
                                onAction={() => updateStatus(inv.id, "Cancelled")}
                              >
                                Mark Cancelled
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </TableRoot>
        </div>

        {totalPages > 1 && (
          <div className="border-t border-card-border px-5 py-3">
            <Pagination
              currentPage={safePage}
              totalPages={totalPages}
              onPageChange={(p) => setPageByTab((prev) => ({ ...prev, [tab]: p }))}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mt-6 space-y-6 px-2 pb-10 lg:px-6">
      {/* Page Header & Breadcrumbs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <Breadcrumbs
            dividerType="chevron"
            items={[
              { href: "/", label: "Overview" },
              { href: "/invoices", label: "Payment Invoices" },
            ]}
          />
          <h1 className="text-[28px] leading-8 font-semibold text-text-primary">
            Payment Invoices
          </h1>
          <p className="text-sm text-text-tertiary">
            Manage itemized studio billing, payment status lifecycle, and printable PDF receipts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <ButtonGroup size="md">
            <button type="button" onClick={exportCsv}>
              Export CSV
            </button>
            <button type="button" onClick={loadInvoices}>
              Refresh
            </button>
          </ButtonGroup>

          <Button
            type="button"
            variant="primary"
            onPress={() =>
              setFormModal({ isOpen: true, mode: "create", invoice: null })
            }
          >
            + Create Invoice
          </Button>
        </div>
      </div>

      {/* KPI Metrics & Overdue Alert */}
      <InvoiceStats summary={summary} />

      {/* Bulk Action Banner */}
      {selectedIds.length > 0 && (
        <Card className="flex flex-wrap items-center justify-between gap-3 border-primary-300 bg-primary-500/5 px-5 py-3">
          <span className="text-sm font-medium text-text-primary">
            {selectedIds.length} invoice(s) selected
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              appearance="outline"
              size="xs"
              onPress={() => handleBulkStatus("Paid")}
              className="border px-3 py-1.5"
            >
              Mark Paid
            </Button>
            <Button
              type="button"
              appearance="outline"
              size="xs"
              onPress={() => handleBulkStatus("Sent")}
              className="border px-3 py-1.5"
            >
              Mark Sent
            </Button>
            <Button
              type="button"
              variant="danger"
              appearance="outline"
              size="xs"
              onPress={handleBulkDelete}
              className="border px-3 py-1.5"
            >
              Delete Selected
            </Button>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="ml-1 text-xs text-text-tertiary hover:text-text-primary"
            >
              Clear
            </button>
          </div>
        </Card>
      )}

      {/* Main Ledger Card with Tabs, Search & Table */}
      <Card className="overflow-hidden p-0">
        <CardHeader className="border-b border-card-border px-5 py-4">
          <CardTitle level={2}>Invoice Ledger</CardTitle>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="w-64">
              <InputGroup className="h-9">
                <InputGroupAddon align="inline-start" className="pr-0 text-icon-tertiary">
                  <SearchIcon className="size-4" />
                </InputGroupAddon>
                <InputGroupInput
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search invoice # or client..."
                  className="pl-2 text-sm"
                />
              </InputGroup>
            </div>

            <select
              value={currencyFilter}
              onChange={(e) => setCurrencyFilter(e.target.value)}
              aria-label="Filter by currency"
              className="h-9 rounded-lg border border-card-border bg-input-background px-2.5 text-xs font-medium text-text-primary"
            >
              <option value="ALL">All Currencies</option>
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as "newest" | "amount_desc" | "due_asc")
              }
              aria-label="Sort invoices"
              className="h-9 rounded-lg border border-card-border bg-input-background px-2.5 text-xs font-medium text-text-primary"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="amount_desc">Sort: Highest Amount</option>
              <option value="due_asc">Sort: Earliest Due Date</option>
            </select>
          </div>
        </CardHeader>

        <TabRoot defaultValue="All" variant="minimal" className="rounded-none border-none px-0 pt-0">
          <TabList className="px-5">
            <TabTrigger value="All" badge={baseFiltered.length || undefined}>
              All Invoices
            </TabTrigger>
            <TabTrigger value="Paid" badge={filterForTab("Paid").length || undefined}>
              Paid
            </TabTrigger>
            <TabTrigger value="Sent" badge={filterForTab("Sent").length || undefined}>
              Sent
            </TabTrigger>
            <TabTrigger value="Draft" badge={filterForTab("Draft").length || undefined}>
              Draft
            </TabTrigger>
            <TabTrigger value="Overdue" badge={filterForTab("Overdue").length || undefined}>
              Overdue
            </TabTrigger>
            <TabTrigger value="Cancelled" badge={filterForTab("Cancelled").length || undefined}>
              Cancelled
            </TabTrigger>
          </TabList>

          {(["All", "Paid", "Sent", "Draft", "Overdue", "Cancelled"] as FilterTabKey[]).map(
            (tab) => (
              <TabContent key={tab} value={tab} className="p-0">
                {renderLedgerTable(tab)}
              </TabContent>
            )
          )}
        </TabRoot>
      </Card>

      {/* Modals */}
      <InvoiceFormModal
        isOpen={formModal.isOpen}
        mode={formModal.mode}
        initialInvoice={formModal.invoice}
        onClose={() => setFormModal((prev) => ({ ...prev, isOpen: false }))}
        onSaved={loadInvoices}
      />

      <InvoicePreviewModal
        invoice={previewInvoice}
        onClose={() => setPreviewInvoice(null)}
        onEdit={(inv) => setFormModal({ isOpen: true, mode: "edit", invoice: inv })}
        onDuplicate={(inv) =>
          setFormModal({ isOpen: true, mode: "duplicate", invoice: inv })
        }
        onStatusChange={updateStatus}
      />
    </div>
  );
}
