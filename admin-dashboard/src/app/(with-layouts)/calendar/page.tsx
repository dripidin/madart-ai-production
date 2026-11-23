"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/tailgrids/core/card";
import { Badge } from "@/components/tailgrids/core/badge";
import { buttonStyles } from "@/components/tailgrids/core/button";

interface WorkItem {
  id: string;
  title: string;
  category: string;
  publishAt?: string;
  publishedAt?: string;
}

interface TaskItem {
  id: string;
  title: string;
  dueDate?: string;
  status: string;
}

export default function ContentCalendarPage() {
  const [works, setWorks] = useState<WorkItem[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [nowMs, setNowMs] = useState<number>(0);

  const loadData = (signal?: AbortSignal) => {
    Promise.all([
      fetch("/api/works?includeScheduled=true", { credentials: "include", signal })
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => []),
      fetch("/api/tasks", { credentials: "include", signal })
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => []),
    ]).then(([worksData, tasksData]) => {
      if (signal?.aborted) return;
      setNowMs(Date.now());
      if (Array.isArray(worksData)) setWorks(worksData);
      if (Array.isArray(tasksData)) setTasks(tasksData);
    });
  };

  useEffect(() => {
    const controller = new AbortController();
    loadData(controller.signal);
    return () => controller.abort();
  }, []);

  const events = useMemo(() => {
    const workEvents = works
      .filter((w) => w.publishAt || w.publishedAt)
      .map((w) => {
        const dt = w.publishAt || w.publishedAt || "";
        const isScheduled = nowMs > 0 && new Date(dt).getTime() > nowMs;
        return {
          id: `work:${w.id}`,
          title: `${isScheduled ? "⏳ Scheduled" : "✅ Live"} · ${w.title}`,
          start: dt,
          backgroundColor: isScheduled ? "#f59e0b" : "#10b981",
          borderColor: isScheduled ? "#d97706" : "#059669",
          editable: true,
        };
      });

    const taskEvents = tasks
      .filter((t) => Boolean(t.dueDate))
      .map((t) => ({
        id: `task:${t.id}`,
        title: `📋 Task Due · ${t.title}`,
        start: t.dueDate,
        backgroundColor: "#3b82f6",
        borderColor: "#2563eb",
        editable: false,
      }));

    return [...workEvents, ...taskEvents];
  }, [works, tasks, nowMs]);

  async function handleEventDrop(info: { event: { id: string; startStr: string } }) {
    if (!info.event.id.startsWith("work:")) return;
    const workId = info.event.id.replace("work:", "");
    try {
      const res = await fetch("/api/works", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: workId, publishAt: new Date(info.event.startStr).toISOString() }),
      });
      if (!res.ok) {
        toast.error("Could not reschedule work.");
        loadData();
        return;
      }
      toast.success("Release date updated!");
      loadData();
    } catch {
      toast.error("Failed updating schedule.");
    }
  }

  return (
    <div className="mt-6 space-y-5 px-2 lg:px-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-[28px] leading-8 font-semibold text-text-primary">
            Content Publishing Calendar
          </h1>
          <p className="mt-1 text-sm text-text-tertiary">
            Drag and drop portfolio works to reschedule launch dates, or review task due dates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <Badge color="success" size="sm">Published</Badge>
            <Badge color="warning" size="sm">Scheduled</Badge>
            <Badge color="blue" size="sm">Task Due</Badge>
          </div>
          <Link
            href="/works/add"
            className={buttonStyles({ variant: "primary", appearance: "fill", size: "sm", className: "px-4 py-2" })}
          >
            + Schedule Work
          </Link>
        </div>
      </div>

      <Card className="p-4">
        <CardContent className="p-0">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek",
            }}
            events={events}
            editable={true}
            eventDrop={handleEventDrop}
            height="auto"
          />
        </CardContent>
      </Card>
    </div>
  );
}
