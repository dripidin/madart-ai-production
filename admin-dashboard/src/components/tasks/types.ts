export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "normal" | "high";

export interface TaskSubtask {
  id: string;
  title: string;
  done: boolean;
}

export interface TaskComment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface TaskRecord {
  id: string;
  title: string;
  description: string;
  project: string;
  tags: string[];
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  assignee: string;
  assignees: string[];
  subtasks: TaskSubtask[];
  comments: TaskComment[];
  estimatedHours: number;
  isOverdue?: boolean;
  completedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export const STUDIO_PROJECTS = [
  "Commercial AI Film",
  "Brand Film",
  "Case Study",
  "Visual Labs",
  "Client Pitch",
  "Studio Operations",
];

export const COLUMNS: {
  id: TaskStatus;
  title: string;
  badgeColor: "gray" | "blue" | "success";
  emptyText: string;
}[] = [
  {
    id: "todo",
    title: "To Do",
    badgeColor: "gray",
    emptyText: "No tasks queued in this stage.",
  },
  {
    id: "in_progress",
    title: "In Progress",
    badgeColor: "blue",
    emptyText: "Drag cards here or click Move to start.",
  },
  {
    id: "done",
    title: "Completed",
    badgeColor: "success",
    emptyText: "Completed studio deliverables appear here.",
  },
];

export function getInitials(name: string): string {
  const parts = String(name || "ST")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return (parts[0] || "ST").slice(0, 2).toUpperCase();
}

export function getPriorityBadgeColor(priority: TaskPriority): "error" | "warning" | "gray" {
  if (priority === "high") return "error";
  if (priority === "normal") return "warning";
  return "gray";
}

export function getStatusLabel(status: TaskStatus): string {
  if (status === "in_progress") return "In Progress";
  if (status === "done") return "Completed";
  return "To Do";
}

export function getStatusBadgeColor(
  status: TaskStatus
): "gray" | "blue" | "success" {
  if (status === "done") return "success";
  if (status === "in_progress") return "blue";
  return "gray";
}

export function computeSubtaskProgress(subtasks: TaskSubtask[]): {
  doneCount: number;
  totalCount: number;
  percent: number;
} {
  if (!Array.isArray(subtasks) || subtasks.length === 0) {
    return { doneCount: 0, totalCount: 0, percent: 0 };
  }
  const doneCount = subtasks.filter((s) => s.done).length;
  const totalCount = subtasks.length;
  return {
    doneCount,
    totalCount,
    percent: Math.round((doneCount / totalCount) * 100),
  };
}
