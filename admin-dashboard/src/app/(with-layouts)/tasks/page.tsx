"use client";

import { useEffect, useMemo, useState } from "react";
import { DragDropProvider, useDraggable, useDroppable } from "@dnd-kit/react";
import { toast } from "sonner";
import { SearchIcon } from "@/components/common/header/icons";
import { TaskDetailModal } from "@/components/tasks/task-detail-modal";
import { TaskFormModal } from "@/components/tasks/task-form-modal";
import { TaskStats } from "@/components/tasks/task-stats";
import {
  COLUMNS,
  computeSubtaskProgress,
  getInitials,
  getPriorityBadgeColor,
  getStatusBadgeColor,
  getStatusLabel,
  type TaskRecord,
  type TaskStatus,
} from "@/components/tasks/types";
import { Avatar, AvatarFallback, AvatarGroup } from "@/components/tailgrids/core/avatar";
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
import { Progress } from "@/components/tailgrids/core/progress";
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
  EyeIcon,
  TrashBinIcon,
} from "@/app/(with-layouts)/tables/basic-tables/_component/package-table/icons";

const PAGE_SIZE = 8;

function TaskKanbanCard({
  task,
  isSelected,
  onToggleSelect,
  onOpenDetail,
  onEdit,
  onDuplicate,
  onMove,
  onDelete,
}: {
  task: TaskRecord;
  isSelected: boolean;
  onToggleSelect: (id: string, checked: boolean) => void;
  onOpenDetail: (t: TaskRecord) => void;
  onEdit: (t: TaskRecord) => void;
  onDuplicate: (t: TaskRecord) => void;
  onMove: (id: string, nextStatus: TaskStatus) => void;
  onDelete: (id: string) => void;
}) {
  const { ref, handleRef, isDragging } = useDraggable({
    id: task.id,
    data: { status: task.status },
  });

  const { doneCount, totalCount, percent } = computeSubtaskProgress(task.subtasks);
  const assignees = task.assignees?.length ? task.assignees : [task.assignee || "Studio"];

  return (
    <div
      ref={ref}
      className={`rounded-xl border bg-card-background p-4 shadow-xs transition-all ${
        isDragging
          ? "scale-[0.98] opacity-50 ring-2 ring-primary-500"
          : isSelected
          ? "border-primary-500 ring-1 ring-primary-500/40"
          : "border-card-border hover:border-primary-300"
      }`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            aria-label={`Select task ${task.title}`}
            checked={isSelected}
            onChange={(e) => onToggleSelect(task.id, e.target.checked)}
            className="size-3.5 cursor-pointer rounded border border-border-primary bg-checkbox-background accent-primary-500"
          />
          <button
            ref={handleRef}
            type="button"
            title="Drag task to another column"
            className="cursor-grab rounded p-0.5 text-text-tertiary hover:bg-background-soft-100 active:cursor-grabbing"
            aria-label={`Drag ${task.title}`}
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="5" cy="4" r="1.3" />
              <circle cx="11" cy="4" r="1.3" />
              <circle cx="5" cy="8" r="1.3" />
              <circle cx="11" cy="8" r="1.3" />
              <circle cx="5" cy="12" r="1.3" />
              <circle cx="11" cy="12" r="1.3" />
            </svg>
          </button>
          <Badge color="gray" size="sm">
            {task.project || "Studio"}
          </Badge>
        </div>

        <div className="flex items-center gap-1">
          <Badge color={getPriorityBadgeColor(task.priority)} size="sm">
            {task.priority}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label={`Actions for ${task.title}`}
              className="flex size-6 items-center justify-center rounded text-icon-tertiary hover:bg-background-soft-100 hover:text-text-primary"
            >
              <MenuDotsIcon className="size-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent placement="bottom end" className="p-1.5">
              <DropdownMenuItem onAction={() => onOpenDetail(task)}>
                Open Brief &amp; Checklist
              </DropdownMenuItem>
              <DropdownMenuItem onAction={() => onEdit(task)}>
                Edit Task
              </DropdownMenuItem>
              <DropdownMenuItem onAction={() => onDuplicate(task)}>
                Duplicate Task
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1" />
              {task.status !== "todo" && (
                <DropdownMenuItem onAction={() => onMove(task.id, "todo")}>
                  Move to To Do
                </DropdownMenuItem>
              )}
              {task.status !== "in_progress" && (
                <DropdownMenuItem onAction={() => onMove(task.id, "in_progress")}>
                  Move to In Progress
                </DropdownMenuItem>
              )}
              {task.status !== "done" && (
                <DropdownMenuItem onAction={() => onMove(task.id, "done")}>
                  Mark Completed
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator className="my-1" />
              <DropdownMenuItem onAction={() => onDelete(task.id)}>
                Delete Task
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onOpenDetail(task)}
        className="w-full text-left"
      >
        <h3 className="text-sm font-semibold text-text-primary hover:text-primary-500">
          {task.title}
        </h3>
      </button>

      {task.description && (
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-text-secondary">
          {task.description}
        </p>
      )}

      {Array.isArray(task.tags) && task.tags.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1">
          {task.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded bg-background-soft-100 px-1.5 py-0.5 text-[10px] font-medium text-text-secondary"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {totalCount > 0 && (
        <div className="mt-3 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-text-tertiary">
            <span>Subtasks</span>
            <span>
              {doneCount}/{totalCount}
            </span>
          </div>
          <Progress progress={percent} />
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-card-border pt-3 text-[11px] text-text-tertiary">
        <div className="flex items-center gap-2">
          <AvatarGroup>
            {assignees.slice(0, 3).map((person) => (
              <Avatar key={person} size="xs">
                <AvatarFallback>{getInitials(person)}</AvatarFallback>
              </Avatar>
            ))}
          </AvatarGroup>
          {task.dueDate && (
            <span
              className={
                task.isOverdue && task.status !== "done"
                  ? "font-semibold text-error-500"
                  : ""
              }
            >
              {task.isOverdue && task.status !== "done" ? "Overdue " : "Due "}
              {task.dueDate}
            </span>
          )}
          {(task.comments || []).length > 0 && (
            <span title="Activity notes">💬 {task.comments.length}</span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {task.status !== "todo" && (
            <button
              type="button"
              onClick={() =>
                onMove(task.id, task.status === "done" ? "in_progress" : "todo")
              }
              className="rounded border border-card-border px-1.5 py-0.5 text-[11px] text-text-secondary hover:bg-background-soft-100"
              title="Move left"
            >
              ←
            </button>
          )}
          {task.status !== "done" && (
            <button
              type="button"
              onClick={() =>
                onMove(task.id, task.status === "todo" ? "in_progress" : "done")
              }
              className="rounded border border-card-border px-1.5 py-0.5 text-[11px] text-text-secondary hover:bg-background-soft-100"
              title="Move right"
            >
              →
            </button>
          )}
          <button
            type="button"
            onClick={() => onDelete(task.id)}
            className="rounded border border-error-200 px-1.5 py-0.5 text-[11px] text-error-600 hover:bg-error-50"
            title="Delete task"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

function TaskColumn({
  column,
  tasks,
  selectedIds,
  onToggleSelect,
  onQuickAdd,
  onOpenDetail,
  onEdit,
  onDuplicate,
  onMove,
  onDelete,
}: {
  column: (typeof COLUMNS)[number];
  tasks: TaskRecord[];
  selectedIds: string[];
  onToggleSelect: (id: string, checked: boolean) => void;
  onQuickAdd: (status: TaskStatus) => void;
  onOpenDetail: (t: TaskRecord) => void;
  onEdit: (t: TaskRecord) => void;
  onDuplicate: (t: TaskRecord) => void;
  onMove: (id: string, nextStatus: TaskStatus) => void;
  onDelete: (id: string) => void;
}) {
  const { ref, isDropTarget } = useDroppable({ id: column.id });

  return (
    <div
      ref={ref}
      className={`flex min-h-[430px] flex-col rounded-2xl border bg-background-soft-50 p-4 transition-colors ${
        isDropTarget
          ? "border-primary-500 bg-primary-50/30 ring-2 ring-primary-500/20"
          : "border-card-border"
      }`}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-text-primary">{column.title}</h2>
          <Badge color={column.badgeColor} size="sm">
            {tasks.length}
          </Badge>
        </div>
        <button
          type="button"
          onClick={() => onQuickAdd(column.id)}
          className="rounded-lg border border-card-border bg-card-background px-2 py-1 text-xs font-medium text-text-secondary hover:border-primary-400 hover:text-primary-500"
        >
          + Add
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-3">
        {tasks.length === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-card-border p-6 text-center text-xs text-text-tertiary">
            {column.emptyText}
          </div>
        ) : (
          tasks.map((task) => (
            <TaskKanbanCard
              key={task.id}
              task={task}
              isSelected={selectedIds.includes(task.id)}
              onToggleSelect={onToggleSelect}
              onOpenDetail={onOpenDetail}
              onEdit={onEdit}
              onDuplicate={onDuplicate}
              onMove={onMove}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default function TaskListPage() {
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "priority_high" | "due_asc">("newest");
  const [listPage, setListPage] = useState(1);
  const [urgentPage, setUrgentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [formModal, setFormModal] = useState<{
    isOpen: boolean;
    mode: "create" | "edit" | "duplicate";
    initialStatus: TaskStatus;
    task: TaskRecord | null;
  }>({ isOpen: false, mode: "create", initialStatus: "todo", task: null });

  const [detailTask, setDetailTask] = useState<TaskRecord | null>(null);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tasks", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setTasks(Array.isArray(data) ? data : []);
      }
    } catch {
      toast.error("Failed to load studio tasks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/tasks", { credentials: "include", signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!controller.signal.aborted && Array.isArray(data)) {
          setTasks(data);
        }
      })
      .catch((err) => {
        if ((err as Error)?.name !== "AbortError") {
          toast.error("Failed to load studio tasks.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  const allAssignees = useMemo(() => {
    const names = new Set<string>();
    for (const t of tasks) {
      if (t.assignee) names.add(t.assignee);
      for (const a of t.assignees || []) names.add(a);
    }
    return Array.from(names);
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = tasks.filter((t) => {
      const matchesPriority = priorityFilter === "all" || t.priority === priorityFilter;
      const matchesAssignee =
        assigneeFilter === "all" ||
        t.assignee === assigneeFilter ||
        (t.assignees || []).includes(assigneeFilter);
      const matchesSearch =
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        (t.project || "").toLowerCase().includes(q) ||
        t.assignee.toLowerCase().includes(q) ||
        (t.tags || []).some((tag) => tag.toLowerCase().includes(q));
      return matchesPriority && matchesAssignee && matchesSearch;
    });

    const sorted = [...list];
    if (sortBy === "priority_high") {
      const weight = { high: 3, normal: 2, low: 1 };
      sorted.sort((a, b) => (weight[b.priority] || 0) - (weight[a.priority] || 0));
    } else if (sortBy === "due_asc") {
      sorted.sort((a, b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999"));
    } else {
      sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    return sorted;
  }, [tasks, search, priorityFilter, assigneeFilter, sortBy]);

  const urgentTasks = useMemo(
    () =>
      filteredTasks.filter(
        (t) => t.status !== "done" && (t.priority === "high" || t.isOverdue)
      ),
    [filteredTasks]
  );

  const handleMove = async (id: string, nextStatus: TaskStatus) => {
    const previous = tasks;
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: nextStatus } : t))
    );
    if (detailTask?.id === id) {
      setDetailTask((prev) => (prev ? { ...prev, status: nextStatus } : null));
    }
    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id, status: nextStatus }),
      });
      if (!res.ok) throw new Error("Failed to update task");
      const data = await res.json();
      if (data.task) {
        setTasks((prev) => prev.map((t) => (t.id === id ? data.task : t)));
        if (detailTask?.id === id) setDetailTask(data.task);
      }
      toast.success(`Moved task to ${getStatusLabel(nextStatus)}.`);
    } catch {
      setTasks(previous);
      toast.error("Failed to save task status.");
    }
  };

  const handleBulkStatus = async (nextStatus: TaskStatus) => {
    if (selectedIds.length === 0) return;
    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "bulk_status",
          ids: selectedIds,
          status: nextStatus,
        }),
      });
      if (!res.ok) throw new Error("Bulk update failed");
      toast.success(
        `Updated ${selectedIds.length} task(s) to ${getStatusLabel(nextStatus)}.`
      );
      setSelectedIds([]);
      await fetchTasks();
    } catch {
      toast.error("Could not update selected tasks.");
    }
  };

  const handleDelete = async (id: string) => {
    const previous = tasks;
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setSelectedIds((prev) => prev.filter((x) => x !== id));
    try {
      const res = await fetch(`/api/tasks?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Task removed.");
    } catch {
      setTasks(previous);
      toast.error("Could not delete task.");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    try {
      const res = await fetch("/api/tasks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ids: selectedIds }),
      });
      if (!res.ok) throw new Error("Bulk delete failed");
      toast.success(`Deleted ${selectedIds.length} selected task(s).`);
      setSelectedIds([]);
      await fetchTasks();
    } catch {
      toast.error("Could not delete selected tasks.");
    }
  };

  const toggleSelect = (id: string, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? (prev.includes(id) ? prev : [...prev, id]) : prev.filter((x) => x !== id)
    );
  };

  const exportCsv = () => {
    const header = [
      "Title",
      "Project",
      "Stage",
      "Priority",
      "Assignees",
      "Due Date",
      "Subtasks Done",
      "Subtasks Total",
      "Tags",
    ];
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = filteredTasks.map((t) => {
      const { doneCount, totalCount } = computeSubtaskProgress(t.subtasks);
      return [
        t.title,
        t.project,
        getStatusLabel(t.status),
        t.priority,
        (t.assignees || [t.assignee]).join("; "),
        t.dueDate,
        doneCount,
        totalCount,
        (t.tags || []).join("; "),
      ]
        .map(esc)
        .join(",");
    });
    const csv = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `madeart-tasks-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported Studio Task List to CSV.");
  };

  const renderTaskTable = (
    rowsAll: TaskRecord[],
    currentPage: number,
    setPageFn: (p: number) => void
  ) => {
    const totalPages = Math.max(1, Math.ceil(rowsAll.length / PAGE_SIZE));
    const safePage = Math.min(currentPage, totalPages);
    const pageRows = rowsAll.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
    const allVisibleSelected =
      pageRows.length > 0 && pageRows.every((t) => selectedIds.includes(t.id));

    return (
      <div className="space-y-4">
        <div className="overflow-hidden">
          <TableRoot className="w-full min-w-[820px] rounded-none border-none">
            <TableHeader className="bg-background-gray-secondary_alt">
              <TableRow className="[&_th]:border-t">
                <TableHead className="w-10 px-4 py-2.5">
                  <input
                    type="checkbox"
                    aria-label="Select all visible tasks"
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
                  Task &amp; Project
                </TableHead>
                <TableHead className="px-4 py-2.5 text-xs font-semibold text-text-secondary">
                  Assignees
                </TableHead>
                <TableHead className="px-4 py-2.5 text-xs font-semibold text-text-secondary">
                  Checklist
                </TableHead>
                <TableHead className="px-4 py-2.5 text-xs font-semibold text-text-secondary">
                  Due Date
                </TableHead>
                <TableHead className="px-4 py-2.5 text-xs font-semibold text-text-secondary">
                  Priority
                </TableHead>
                <TableHead className="px-4 py-2.5 text-xs font-semibold text-text-secondary">
                  Stage
                </TableHead>
                <TableHead className="px-4 py-2.5 text-right text-xs font-semibold text-text-secondary">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {pageRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="px-6 py-12 text-center text-sm text-text-tertiary">
                    No tasks match your current filters.
                  </TableCell>
                </TableRow>
              ) : (
                pageRows.map((task) => {
                  const { doneCount, totalCount, percent } = computeSubtaskProgress(
                    task.subtasks
                  );
                  const assignees = task.assignees?.length
                    ? task.assignees
                    : [task.assignee || "Studio"];

                  return (
                    <TableRow key={task.id} className="hover:bg-background-soft-100/40">
                      <TableCell className="px-4 py-3.5">
                        <input
                          type="checkbox"
                          aria-label={`Select task ${task.title}`}
                          checked={selectedIds.includes(task.id)}
                          onChange={(e) => toggleSelect(task.id, e.target.checked)}
                          className="size-4 cursor-pointer rounded border border-border-primary bg-checkbox-background accent-primary-500"
                        />
                      </TableCell>

                      <TableCell className="px-4 py-3.5">
                        <button
                          type="button"
                          onClick={() => setDetailTask(task)}
                          className="text-left text-sm font-semibold text-text-primary hover:text-primary-500"
                        >
                          {task.title}
                        </button>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-text-tertiary">
                          <span>{task.project || "Studio"}</span>
                          {task.estimatedHours > 0 && <span>· {task.estimatedHours}h</span>}
                          {(task.comments || []).length > 0 && (
                            <span>· {task.comments.length} notes</span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <AvatarGroup>
                            {assignees.slice(0, 3).map((person) => (
                              <Avatar key={person} size="xs">
                                <AvatarFallback>{getInitials(person)}</AvatarFallback>
                              </Avatar>
                            ))}
                          </AvatarGroup>
                          <span className="max-w-32 truncate text-xs text-text-secondary">
                            {assignees[0]}
                            {assignees.length > 1 ? ` +${assignees.length - 1}` : ""}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="w-36 px-4 py-3.5">
                        {totalCount > 0 ? (
                          <div className="space-y-1">
                            <span className="text-[11px] font-medium text-text-tertiary">
                              {doneCount}/{totalCount} steps
                            </span>
                            <Progress progress={percent} />
                          </div>
                        ) : (
                          <span className="text-xs text-text-tertiary">—</span>
                        )}
                      </TableCell>

                      <TableCell className="px-4 py-3.5 text-xs whitespace-nowrap">
                        <span
                          className={
                            task.isOverdue && task.status !== "done"
                              ? "font-semibold text-error-500"
                              : "text-text-secondary"
                          }
                        >
                          {task.dueDate || "Unscheduled"}
                        </span>
                      </TableCell>

                      <TableCell className="px-4 py-3.5">
                        <Badge color={getPriorityBadgeColor(task.priority)} size="sm">
                          {task.priority}
                        </Badge>
                      </TableCell>

                      <TableCell className="px-4 py-3.5">
                        <Badge color={getStatusBadgeColor(task.status)} size="sm">
                          {getStatusLabel(task.status)}
                        </Badge>
                      </TableCell>

                      <TableCell className="px-4 py-3.5 text-right">
                        <div className="inline-flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setDetailTask(task)}
                            className="rounded p-1 text-icon-tertiary transition-colors hover:bg-background-soft-100 hover:text-primary-500"
                            title="View Task Details"
                          >
                            <EyeIcon />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(task.id)}
                            className="rounded p-1 text-icon-tertiary transition-colors hover:bg-error-50 hover:text-error-500"
                            title="Delete Task"
                          >
                            <TrashBinIcon />
                          </button>
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              aria-label={`More actions for ${task.title}`}
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
                                    initialStatus: task.status,
                                    task,
                                  })
                                }
                              >
                                Edit Task
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onAction={() =>
                                  setFormModal({
                                    isOpen: true,
                                    mode: "duplicate",
                                    initialStatus: "todo",
                                    task,
                                  })
                                }
                              >
                                Duplicate Task
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="my-1" />
                              {task.status !== "todo" && (
                                <DropdownMenuItem
                                  onAction={() => handleMove(task.id, "todo")}
                                >
                                  Move to To Do
                                </DropdownMenuItem>
                              )}
                              {task.status !== "in_progress" && (
                                <DropdownMenuItem
                                  onAction={() => handleMove(task.id, "in_progress")}
                                >
                                  Move to In Progress
                                </DropdownMenuItem>
                              )}
                              {task.status !== "done" && (
                                <DropdownMenuItem
                                  onAction={() => handleMove(task.id, "done")}
                                >
                                  Mark Completed
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </TableRoot>
        </div>

        {totalPages > 1 && (
          <div className="border-t border-card-border px-5 py-3">
            <Pagination
              currentPage={safePage}
              totalPages={totalPages}
              onPageChange={setPageFn}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mt-6 space-y-6 px-2 pb-10 lg:px-6">
      {/* Header & Breadcrumbs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <Breadcrumbs
            dividerType="chevron"
            items={[
              { href: "/", label: "Overview" },
              { href: "/tasks", label: "Studio Task List" },
            ]}
          />
          <h1 className="text-[28px] leading-8 font-semibold text-text-primary">
            Studio Task List
          </h1>
          <p className="text-sm text-text-tertiary">
            Coordinate AI production sprints with Kanban drag-and-drop, itemized checklists, and table tracking.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <ButtonGroup size="md">
            <button type="button" onClick={exportCsv}>
              Export CSV
            </button>
            <button type="button" onClick={fetchTasks}>
              Refresh
            </button>
          </ButtonGroup>

          <Button
            type="button"
            variant="primary"
            onPress={() =>
              setFormModal({
                isOpen: true,
                mode: "create",
                initialStatus: "todo",
                task: null,
              })
            }
          >
            + New Task
          </Button>
        </div>
      </div>

      {/* KPI Cards & Overdue Alert */}
      <TaskStats tasks={tasks} />

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <Card className="flex flex-wrap items-center justify-between gap-3 border-primary-300 bg-primary-500/5 px-5 py-3">
          <span className="text-sm font-medium text-text-primary">
            {selectedIds.length} task(s) selected
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              appearance="outline"
              size="xs"
              onPress={() => handleBulkStatus("todo")}
              className="border px-3 py-1.5"
            >
              Move To Do
            </Button>
            <Button
              type="button"
              appearance="outline"
              size="xs"
              onPress={() => handleBulkStatus("in_progress")}
              className="border px-3 py-1.5"
            >
              Move In Progress
            </Button>
            <Button
              type="button"
              appearance="outline"
              size="xs"
              onPress={() => handleBulkStatus("done")}
              className="border px-3 py-1.5"
            >
              Mark Completed
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

      {/* Main Workspace Card */}
      <Card className="overflow-hidden p-0">
        <CardHeader className="border-b border-card-border px-5 py-4">
          <CardTitle level={2}>Production Workspace</CardTitle>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="w-60">
              <InputGroup className="h-9">
                <InputGroupAddon align="inline-start" className="pr-0 text-icon-tertiary">
                  <SearchIcon className="size-4" />
                </InputGroupAddon>
                <InputGroupInput
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search task, project or tag..."
                  className="pl-2 text-sm"
                />
              </InputGroup>
            </div>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              aria-label="Filter by priority"
              className="h-9 rounded-lg border border-card-border bg-input-background px-2.5 text-xs font-medium text-text-primary"
            >
              <option value="all">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="normal">Normal Priority</option>
              <option value="low">Low Priority</option>
            </select>

            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              aria-label="Filter by assignee"
              className="h-9 rounded-lg border border-card-border bg-input-background px-2.5 text-xs font-medium text-text-primary"
            >
              <option value="all">All Assignees</option>
              {allAssignees.map((person) => (
                <option key={person} value={person}>
                  {person}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as "newest" | "priority_high" | "due_asc")
              }
              aria-label="Sort tasks"
              className="h-9 rounded-lg border border-card-border bg-input-background px-2.5 text-xs font-medium text-text-primary"
            >
              <option value="newest">Sort: Newest</option>
              <option value="priority_high">Sort: Highest Priority</option>
              <option value="due_asc">Sort: Earliest Due</option>
            </select>
          </div>
        </CardHeader>

        <TabRoot defaultValue="board" variant="minimal" className="rounded-none border-none px-0 pt-0">
          <TabList className="px-5">
            <TabTrigger value="board" badge={filteredTasks.length || undefined}>
              Kanban Board
            </TabTrigger>
            <TabTrigger value="list" badge={filteredTasks.length || undefined}>
              List / Table View
            </TabTrigger>
            <TabTrigger value="urgent" badge={urgentTasks.length || undefined}>
              High Priority &amp; Overdue
            </TabTrigger>
          </TabList>

          {/* 1. Drag-and-Drop Kanban Board View */}
          <TabContent value="board" className="p-5">
            {loading ? (
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                {[1, 2, 3].map((k) => (
                  <Card key={k} className="h-96 animate-pulse p-4" />
                ))}
              </div>
            ) : (
              <DragDropProvider
                onDragEnd={(event) => {
                  if (event.canceled) return;
                  const sourceId = event.operation.source?.id;
                  const targetId = event.operation.target?.id;
                  if (!sourceId || !targetId) return;
                  const nextStatus = String(targetId) as TaskStatus;
                  if (!["todo", "in_progress", "done"].includes(nextStatus)) return;
                  const item = tasks.find((t) => t.id === String(sourceId));
                  if (item && item.status !== nextStatus) {
                    handleMove(item.id, nextStatus);
                  }
                }}
              >
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                  {COLUMNS.map((col) => (
                    <TaskColumn
                      key={col.id}
                      column={col}
                      tasks={filteredTasks.filter((t) => t.status === col.id)}
                      selectedIds={selectedIds}
                      onToggleSelect={toggleSelect}
                      onQuickAdd={(st) =>
                        setFormModal({
                          isOpen: true,
                          mode: "create",
                          initialStatus: st,
                          task: null,
                        })
                      }
                      onOpenDetail={(t) => setDetailTask(t)}
                      onEdit={(t) =>
                        setFormModal({
                          isOpen: true,
                          mode: "edit",
                          initialStatus: t.status,
                          task: t,
                        })
                      }
                      onDuplicate={(t) =>
                        setFormModal({
                          isOpen: true,
                          mode: "duplicate",
                          initialStatus: "todo",
                          task: t,
                        })
                      }
                      onMove={handleMove}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </DragDropProvider>
            )}
          </TabContent>

          {/* 2. Structured List / Table View */}
          <TabContent value="list" className="p-0">
            {renderTaskTable(filteredTasks, listPage, setListPage)}
          </TabContent>

          {/* 3. High Priority & Overdue View */}
          <TabContent value="urgent" className="p-0">
            {renderTaskTable(urgentTasks, urgentPage, setUrgentPage)}
          </TabContent>
        </TabRoot>
      </Card>

      {/* Modals */}
      <TaskFormModal
        isOpen={formModal.isOpen}
        mode={formModal.mode}
        initialStatus={formModal.initialStatus}
        initialTask={formModal.task}
        onClose={() => setFormModal((prev) => ({ ...prev, isOpen: false }))}
        onSaved={fetchTasks}
      />

      <TaskDetailModal
        task={detailTask}
        onClose={() => setDetailTask(null)}
        onEdit={(t) =>
          setFormModal({
            isOpen: true,
            mode: "edit",
            initialStatus: t.status,
            task: t,
          })
        }
        onDuplicate={(t) =>
          setFormModal({
            isOpen: true,
            mode: "duplicate",
            initialStatus: "todo",
            task: t,
          })
        }
        onDelete={handleDelete}
        onMoveStatus={handleMove}
        onTaskUpdated={(updated) => {
          setDetailTask(updated);
          setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        }}
      />
    </div>
  );
}
