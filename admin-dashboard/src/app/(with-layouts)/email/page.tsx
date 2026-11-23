"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/tailgrids/core/badge";
import { Button } from "@/components/tailgrids/core/button";
import { Card } from "@/components/tailgrids/core/card";
import { Input } from "@/components/tailgrids/core/input";

interface MessageItem {
  id: string;
  name: string;
  email: string;
  company: string;
  projectType: string;
  message: string;
  extraFields?: Record<string, string>;
  country: string;
  status: "unread" | "read" | "replied" | string;
  createdAt: string;
}

export default function EmailInboxPage() {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const loadMessages = (signal?: AbortSignal) => {
    fetch("/api/messages", { credentials: "include", signal })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (!signal?.aborted && Array.isArray(data)) {
          setMessages(data);
          setSelectedId((prev) => prev ?? (data.length > 0 ? data[0].id : null));
        }
      })
      .catch((err) => {
        if ((err as Error)?.name !== "AbortError") {
          toast.error("Failed to load inbox messages.");
        }
      });
  };

  useEffect(() => {
    const controller = new AbortController();
    loadMessages(controller.signal);
    return () => controller.abort();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return messages.filter((m) => {
      const statusOk = filterStatus === "all" || m.status === filterStatus;
      const qOk =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        (m.company || "").toLowerCase().includes(q) ||
        (m.message || "").toLowerCase().includes(q);
      return statusOk && qOk;
    });
  }, [messages, filterStatus, search]);

  const activeMessage = useMemo(
    () => messages.find((m) => m.id === selectedId) || filtered[0] || null,
    [messages, filtered, selectedId]
  );

  async function selectMessage(m: MessageItem) {
    setSelectedId(m.id);
    if (m.status === "unread") {
      try {
        await fetch("/api/messages", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ id: m.id, status: "read" }),
        });
        setMessages((prev) =>
          prev.map((item) => (item.id === m.id ? { ...item, status: "read" } : item))
        );
      } catch {}
    }
  }

  async function toggleStatus(m: MessageItem, nextStatus: "read" | "replied" | "unread") {
    setUpdatingStatus(true);
    try {
      const res = await fetch("/api/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: m.id, status: nextStatus }),
      });
      if (!res.ok) throw new Error("Failed updating status.");
      setMessages((prev) =>
        prev.map((item) => (item.id === m.id ? { ...item, status: nextStatus } : item))
      );
      toast.success(`Inquiry marked ${nextStatus}.`);
    } catch {
      toast.error("Could not update inquiry status.");
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/messages?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) return;
      setMessages((prev) => prev.filter((m) => m.id !== id));
      if (selectedId === id) setSelectedId(null);
      toast.success("Inquiry deleted.");
    } catch {
      toast.error("Failed to delete message.");
    }
  }

  function exportCsv() {
    const header = ["Date", "Name", "Email", "Company", "Project Type", "Country", "Status", "Message"];
    const esc = (v: string) => `"${String(v || "").replace(/"/g, '""')}"`;
    const rows = messages.map((m) =>
      [m.createdAt, m.name, m.email, m.company, m.projectType, m.country, m.status, m.message]
        .map(esc)
        .join(",")
    );
    const csv = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `madeart-inquiries-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mt-6 space-y-5 px-2 lg:px-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-[28px] leading-8 font-semibold text-text-primary">Email Inbox</h1>
          <p className="mt-1 text-sm text-text-tertiary">
            Review client inquiries with GeoIP origins, export CSV, and reply via your mail app.
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          appearance="outline"
          size="sm"
          onPress={exportCsv}
          className="border px-4 py-2"
        >
          Export CSV
        </Button>
      </div>

      <div className="grid min-h-[600px] grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Left List */}
        <Card className="flex flex-col overflow-hidden p-0 lg:col-span-5">
          <div className="space-y-3 border-b border-card-border p-4">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search sender, company, or message..."
              className="w-full"
            />
            <div className="flex flex-wrap gap-1.5">
              {["all", "unread", "read", "replied"].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setFilterStatus(st)}
                  className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
                    filterStatus === st
                      ? "bg-primary-500 text-white"
                      : "bg-background-soft-100 text-text-secondary"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 divide-y divide-card-border overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-sm text-text-tertiary">No messages found.</div>
            ) : (
              filtered.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => selectMessage(m)}
                  className={`w-full p-4 text-left transition hover:bg-background-soft-100 ${
                    activeMessage?.id === m.id ? "bg-primary-500/5" : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold text-text-primary">
                      {m.name}
                    </span>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <Badge color="gray" size="sm">
                        {m.country || "XX"}
                      </Badge>
                      <Badge
                        color={
                          m.status === "unread"
                            ? "warning"
                            : m.status === "replied"
                            ? "success"
                            : "blue"
                        }
                        size="sm"
                      >
                        {m.status}
                      </Badge>
                    </div>
                  </div>
                  <p className="mt-1 truncate text-xs text-text-tertiary">
                    {m.email} · {m.projectType}
                  </p>
                  <p className="mt-1.5 line-clamp-2 text-xs text-text-secondary">{m.message}</p>
                </button>
              ))
            )}
          </div>
        </Card>

        {/* Right Inquiry Details & Actions */}
        <Card className="flex flex-col justify-between p-6 lg:col-span-7">
          {!activeMessage ? (
            <div className="flex h-full items-center justify-center text-sm text-text-tertiary">
              Select a message to inspect or reply.
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-card-border pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-text-primary">
                      {activeMessage.name}
                    </h2>
                    <Badge color="gray" size="sm">
                      Country: {activeMessage.country || "XX"}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-sm text-text-tertiary">
                    {activeMessage.email} · {activeMessage.company}
                  </p>
                  <p className="mt-1 text-xs text-text-tertiary">
                    Project: {activeMessage.projectType} ·{" "}
                    {new Date(activeMessage.createdAt).toLocaleString()}
                  </p>
                </div>

                <Button
                  type="button"
                  variant="danger"
                  appearance="outline"
                  size="xs"
                  onPress={() => handleDelete(activeMessage.id)}
                  className="border px-3 py-1.5"
                >
                  Delete
                </Button>
              </div>

              <div className="rounded-xl border border-card-border bg-background-soft-100 p-4 text-sm whitespace-pre-wrap text-text-primary">
                {activeMessage.message || "(No message body)"}
              </div>

              {activeMessage.extraFields && Object.keys(activeMessage.extraFields).length > 0 && (
                <div className="rounded-xl border border-card-border p-4">
                  <p className="mb-2 text-xs font-semibold text-text-tertiary uppercase">
                    Additional Custom Fields
                  </p>
                  <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {Object.entries(activeMessage.extraFields).map(([k, v]) => (
                      <div key={k} className="text-xs">
                        <dt className="font-medium text-text-tertiary">{k}</dt>
                        <dd className="text-text-primary">{String(v)}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-card-border pt-4">
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={`mailto:${encodeURIComponent(activeMessage.email)}?subject=${encodeURIComponent(
                      `Re: MadeArt Inquiry — ${activeMessage.projectType || "Project"}`
                    )}`}
                    className="inline-flex h-10 items-center justify-center rounded-lg bg-primary-500 px-4 text-sm font-medium text-white transition-colors hover:bg-primary-600"
                  >
                    Open in Mail App (mailto:)
                  </a>
                  <Button
                    type="button"
                    appearance="outline"
                    isDisabled={updatingStatus || activeMessage.status === "replied"}
                    onPress={() => toggleStatus(activeMessage, "replied")}
                    className="border px-4 py-2"
                  >
                    {activeMessage.status === "replied" ? "Marked Replied" : "Mark as Replied"}
                  </Button>
                </div>

                {activeMessage.status !== "unread" && (
                  <Button
                    type="button"
                    appearance="outline"
                    size="xs"
                    isDisabled={updatingStatus}
                    onPress={() => toggleStatus(activeMessage, "unread")}
                    className="border px-3 py-1.5"
                  >
                    Mark Unread
                  </Button>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
