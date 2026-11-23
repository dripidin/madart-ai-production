"use client";

import { BellIcon } from "@/components/common/header/icons";
import { Button } from "@/components/tailgrids/core/button";
import { Popover } from "@/components/tailgrids/core/popover";
import { ScrollArea, ScrollAreaViewport, ScrollBar } from "@/components/tailgrids/core/scroll-area";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { Dialog, DialogTrigger, Header, Heading } from "react-aria-components";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export function NotificationsButton() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = () => {
    fetch("/api/notifications", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.notifications)) {
          setItems(data.notifications.slice(0, 8));
          setUnreadCount(Number(data.unreadCount || 0));
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadNotifications();
    const timer = setInterval(loadNotifications, 20000);
    return () => clearInterval(timer);
  }, []);

  const markAllRead = () => {
    fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ action: "mark_all_read" }),
    })
      .then(() => loadNotifications())
      .catch(() => {});
  };

  return (
    <DialogTrigger>
      <Button
        variant="ghost"
        iconOnly
        aria-label="Notifications"
        className="relative flex size-10 items-center justify-center rounded-full border border-border-secondary bg-background-soft-100 text-icon-secondary hover:bg-background-soft-200 dark:bg-card-surface-area"
        onPress={loadNotifications}
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-error-500 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-error-500" />
          </span>
        )}
      </Button>

      <Popover
        placement="bottom end"
        className="w-80 rounded-2xl border border-card-border bg-card-background p-0 shadow-xl sm:w-96"
      >
        <Dialog className="outline-none">
          <Header className="flex items-center justify-between border-b border-card-border px-4 py-3">
            <Heading slot="title" className="text-sm font-semibold text-text-primary">
              Notifications {unreadCount > 0 ? `(${unreadCount})` : ""}
            </Heading>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs font-medium text-primary-500 hover:underline"
              >
                Mark all read
              </button>
            )}
          </Header>

          <ScrollArea className="max-h-80">
            <ScrollAreaViewport className="p-2">
              {items.length === 0 ? (
                <div className="px-4 py-8 text-center text-xs text-text-tertiary">
                  No studio notifications yet.
                </div>
              ) : (
                <div className="space-y-1">
                  {items.map((n) => (
                    <div
                      key={n.id}
                      className={`rounded-xl px-3 py-2.5 transition-colors ${
                        n.read ? "opacity-75" : "bg-primary-500/5"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-text-primary">{n.title}</span>
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-xs text-text-tertiary">{n.body}</p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollAreaViewport>
            <ScrollBar />
          </ScrollArea>

          <div className="border-t border-card-border p-3 text-center">
            <Link
              href="/notifications"
              className="block w-full rounded-lg border border-card-border py-2 text-xs font-medium text-text-primary hover:bg-background-soft-100"
            >
              View all notifications
            </Link>
          </div>
        </Dialog>
      </Popover>
    </DialogTrigger>
  );
}
