"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/tailgrids/core/badge";
import { Button } from "@/components/tailgrids/core/button";
import { Card } from "@/components/tailgrids/core/card";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

const FILTER_TYPES = [
  { key: "all", label: "All Events" },
  { key: "form_submission", label: "Forms" },
  { key: "task_created", label: "Tasks" },
  { key: "calendar_event", label: "Calendar" },
  { key: "invoice_created", label: "Invoices" },
];

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [filterType, setFilterType] = useState("all");
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = (type: string, signal?: AbortSignal) => {
    fetch(`/api/notifications?type=${encodeURIComponent(type)}`, {
      credentials: "include",
      signal,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!signal?.aborted && data && Array.isArray(data.notifications)) {
          setItems(data.notifications);
          setUnreadCount(Number(data.unreadCount || 0));
        }
      })
      .catch(() => {});
  };

  const load = () => {
    fetchNotifications(filterType);
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchNotifications(filterType, controller.signal);
    return () => controller.abort();
  }, [filterType]);

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ action: "mark_all_read" }),
    });
    toast.success("All notifications marked as read.");
    load();
  }

  async function clearAll() {
    await fetch("/api/notifications?clearAll=true", {
      method: "DELETE",
      credentials: "include",
    });
    toast.success("Notification log cleared.");
    load();
  }

  return (
    <div className="mt-6 space-y-5 px-2 lg:px-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-[28px] leading-8 font-semibold text-text-primary">
            Notifications Center {unreadCount > 0 ? `(${unreadCount} unread)` : ""}
          </h1>
          <p className="mt-1 text-sm text-text-tertiary">
            Central log of inbound inquiries, task updates, scheduled releases, and invoices.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="primary"
            appearance="outline"
            size="sm"
            onPress={markAllRead}
            className="border px-4 py-2"
          >
            Mark all read
          </Button>
          <Button
            type="button"
            variant="danger"
            appearance="outline"
            size="sm"
            onPress={clearAll}
            className="border px-4 py-2"
          >
            Clear log
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTER_TYPES.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilterType(f.key)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium ${
              filterType === f.key
                ? "border-primary-500 bg-primary-500 text-white"
                : "border-card-border bg-card-background text-text-secondary"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <Card className="divide-y divide-card-border p-0">
        {items.length === 0 ? (
          <div className="p-10 text-center text-sm text-text-tertiary">
            No notifications recorded for this filter.
          </div>
        ) : (
          items.map((n) => (
            <div
              key={n.id}
              className={`flex flex-col justify-between gap-2 p-4 sm:flex-row sm:items-center ${
                n.read ? "" : "bg-primary-500/5"
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-text-primary">{n.title}</span>
                  <Badge color="gray" size="sm">
                    {n.type}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-text-secondary">{n.body}</p>
              </div>
              <span className="shrink-0 text-xs text-text-tertiary">
                {new Date(n.createdAt).toLocaleString()}
              </span>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
