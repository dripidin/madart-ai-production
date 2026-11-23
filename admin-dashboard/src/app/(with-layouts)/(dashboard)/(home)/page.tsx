"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import GeoIpWorldMap from "@/components/analytics/geoip-world-map";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/tailgrids/core/card";
import { Badge } from "@/components/tailgrids/core/badge";
import { buttonStyles } from "@/components/tailgrids/core/button";

interface WorkItem {
  id: string;
  title: string;
  category: string;
  videoType?: string;
  youtubeId?: string | null;
  publishAt?: string;
  isNewRelease?: boolean;
}

interface MessageItem {
  id: string;
  name: string;
  email: string;
  projectType: string;
  country: string;
  status: string;
  createdAt: string;
}

interface TaskItem {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate?: string;
}

interface InvoiceSummary {
  totalPaid: number;
  totalPending: number;
  count: number;
}

export default function MadeArtOverviewPage() {
  const [works, setWorks] = useState<WorkItem[]>([]);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [nowMs, setNowMs] = useState<number | null>(null);
  const [invoiceSummary, setInvoiceSummary] = useState<InvoiceSummary>({
    totalPaid: 0,
    totalPending: 0,
    count: 0,
  });

  useEffect(() => {
    const controller = new AbortController();
    const opts: RequestInit = { credentials: "include", signal: controller.signal };

    Promise.all([
      fetch("/api/works?includeScheduled=true", opts).then((r) => (r.ok ? r.json() : [])).catch(() => []),
      fetch("/api/messages", opts).then((r) => (r.ok ? r.json() : [])).catch(() => []),
      fetch("/api/tasks", opts).then((r) => (r.ok ? r.json() : [])).catch(() => []),
      fetch("/api/invoices", opts).then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ]).then(([worksData, messagesData, tasksData, invoicesData]) => {
      if (controller.signal.aborted) return;
      setNowMs(Date.now());
      if (Array.isArray(worksData)) setWorks(worksData);
      if (Array.isArray(messagesData)) setMessages(messagesData);
      if (Array.isArray(tasksData)) setTasks(tasksData);
      if (invoicesData?.summary) setInvoiceSummary(invoicesData.summary);
    });

    return () => controller.abort();
  }, []);

  const countryCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const m of messages) {
      const c = (m.country || "XX").toUpperCase();
      map[c] = (map[c] || 0) + 1;
    }
    return map;
  }, [messages]);

  const unreadMessages = messages.filter((m) => m.status === "unread").length;
  const openTasks = tasks.filter((t) => t.status !== "done").length;
  const scheduledWorks =
    nowMs === null
      ? 0
      : works.filter((w) => w.publishAt && new Date(w.publishAt).getTime() > nowMs).length;

  return (
    <div className="mt-6 space-y-6 px-2 lg:px-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-[28px] leading-8 font-semibold text-text-primary">
            MadeArt Studio Overview
          </h1>
          <p className="mt-1 text-sm text-text-tertiary">
            Manage AI productions, client inquiries, scheduled releases, and invoices.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Link
            href="/works/add"
            className={buttonStyles({ variant: "primary", appearance: "fill", size: "sm", className: "px-4 py-2" })}
          >
            + Add Work
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-5">
          <p className="text-xs font-medium text-text-tertiary uppercase">Client Inquiries</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-text-primary">{messages.length}</span>
            <Badge color={unreadMessages > 0 ? "warning" : "success"} size="sm">
              {unreadMessages} unread
            </Badge>
          </div>
          <Link href="/email" className="mt-3 inline-block text-xs font-medium text-primary-500 hover:underline">
            Open Email Inbox →
          </Link>
        </Card>

        <Card className="p-5">
          <p className="text-xs font-medium text-text-tertiary uppercase">Portfolio Works</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-text-primary">{works.length}</span>
            <Badge color="blue" size="sm">
              {scheduledWorks} scheduled
            </Badge>
          </div>
          <Link href="/works" className="mt-3 inline-block text-xs font-medium text-primary-500 hover:underline">
            Manage Works →
          </Link>
        </Card>

        <Card className="p-5">
          <p className="text-xs font-medium text-text-tertiary uppercase">Studio Tasks</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-text-primary">{tasks.length}</span>
            <Badge color={openTasks > 0 ? "primary" : "success"} size="sm">
              {openTasks} active
            </Badge>
          </div>
          <Link href="/tasks" className="mt-3 inline-block text-xs font-medium text-primary-500 hover:underline">
            Open Kanban Board →
          </Link>
        </Card>

        <Card className="p-5">
          <p className="text-xs font-medium text-text-tertiary uppercase">Revenue & Invoices</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-text-primary">
              ${invoiceSummary.totalPaid.toLocaleString()}
            </span>
            <Badge color="gray" size="sm">
              ${invoiceSummary.totalPending.toLocaleString()} pending
            </Badge>
          </div>
          <Link href="/invoices" className="mt-3 inline-block text-xs font-medium text-primary-500 hover:underline">
            View Invoices →
          </Link>
        </Card>
      </div>

      {/* GeoIP Map & Recent Activity */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <GeoIpWorldMap countryCounts={countryCounts} />
        </div>

        <Card className="p-0 lg:col-span-5">
          <CardHeader className="border-b border-card-border px-5 py-4">
            <CardTitle level={2}>Recent Inquiries</CardTitle>
            <Link href="/email" className="text-xs font-medium text-primary-500 hover:underline">
              See all
            </Link>
          </CardHeader>
          <CardContent className="p-4">
            {messages.length === 0 ? (
              <p className="py-10 text-center text-sm text-text-tertiary">
                No contact inquiries received yet.
              </p>
            ) : (
              <div className="space-y-3">
                {messages.slice(0, 5).map((m) => (
                  <div
                    key={m.id}
                    className="flex items-start justify-between gap-3 rounded-xl border border-card-border p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-text-primary">{m.name}</p>
                      <p className="truncate text-xs text-text-tertiary">
                        {m.email} · {m.projectType}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <Badge color="gray" size="sm">
                        {m.country || "XX"}
                      </Badge>
                      <Badge
                        color={m.status === "unread" ? "warning" : m.status === "replied" ? "success" : "blue"}
                        size="sm"
                      >
                        {m.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
