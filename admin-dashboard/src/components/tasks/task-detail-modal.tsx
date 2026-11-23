"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
} from "@/components/tailgrids/core/avatar";
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
import { Progress } from "@/components/tailgrids/core/progress";
import { Separator } from "@/components/tailgrids/core/separator";
import { TextArea } from "@/components/tailgrids/core/text-area";
import {
  computeSubtaskProgress,
  getInitials,
  getPriorityBadgeColor,
  getStatusBadgeColor,
  getStatusLabel,
  type TaskRecord,
  type TaskStatus,
} from "./types";

interface TaskDetailModalProps {
  task: TaskRecord | null;
  onClose: () => void;
  onEdit: (task: TaskRecord) => void;
  onDuplicate: (task: TaskRecord) => void;
  onDelete: (id: string) => void;
  onMoveStatus: (id: string, nextStatus: TaskStatus) => void;
  onTaskUpdated: (updated: TaskRecord) => void;
}

export function TaskDetailModal({
  task,
  onClose,
  onEdit,
  onDuplicate,
  onDelete,
  onMoveStatus,
  onTaskUpdated,
}: TaskDetailModalProps) {
  const [commentText, setCommentText] = useState("");
  const [postingComment, setPostingComment] = useState(false);

  if (!task) return null;

  const { doneCount, totalCount, percent } = computeSubtaskProgress(task.subtasks);

  const toggleSubtask = async (subId: string) => {
    const nextSubtasks = (task.subtasks || []).map((s) =>
      s.id === subId ? { ...s, done: !s.done } : s
    );
    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: task.id, subtasks: nextSubtasks }),
      });
      if (!res.ok) throw new Error("Failed updating checklist.");
      const data = await res.json();
      if (data.task) onTaskUpdated(data.task);
    } catch {
      toast.error("Could not update subtask.");
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setPostingComment(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "add_comment",
          id: task.id,
          author: "Bidjou Mohamed",
          text: commentText.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed adding note.");
      setCommentText("");
      if (data.task) onTaskUpdated(data.task);
      toast.success("Note added to task activity.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add note.");
    } finally {
      setPostingComment(false);
    }
  };

  return (
    <Backdrop isOpen={Boolean(task)} onOpenChange={(open) => !open && onClose()}>
      <Dialog className="max-h-[90vh] max-w-2xl overflow-y-auto p-6">
        <DialogHeader className="border-b border-card-border pb-4 pr-8">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge color="blue" size="sm">
              {task.project || "Studio"}
            </Badge>
            <Badge color={getStatusBadgeColor(task.status)} size="sm">
              {getStatusLabel(task.status)}
            </Badge>
            <Badge color={getPriorityBadgeColor(task.priority)} size="sm">
              {task.priority} priority
            </Badge>
            {task.isOverdue && task.status !== "done" && (
              <Badge color="error" size="sm">
                Overdue
              </Badge>
            )}
          </div>
          <DialogTitle className="text-xl">{task.title}</DialogTitle>
        </DialogHeader>

        <DialogBody className="space-y-5">
          {/* Quick Stage Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-card-border bg-background-soft-50 p-3">
            <span className="text-xs font-semibold text-text-tertiary uppercase">
              Stage
            </span>
            <ButtonGroup size="xs">
              {(["todo", "in_progress", "done"] as TaskStatus[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => onMoveStatus(task.id, st)}
                  className={
                    task.status === st
                      ? "bg-primary-500! text-white!"
                      : ""
                  }
                >
                  {getStatusLabel(st)}
                </button>
              ))}
            </ButtonGroup>
          </div>

          {/* Collaborators & Deadlines */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold text-text-tertiary uppercase">
                Assigned Team
              </p>
              <div className="flex items-center gap-2">
                <AvatarGroup>
                  {(task.assignees || [task.assignee]).slice(0, 4).map((person) => (
                    <Avatar key={person} size="sm">
                      <AvatarFallback>{getInitials(person)}</AvatarFallback>
                      <AvatarBadge status="online" size="sm" />
                    </Avatar>
                  ))}
                </AvatarGroup>
                <span className="truncate text-xs font-medium text-text-primary">
                  {(task.assignees || [task.assignee]).join(", ")}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-[11px] font-semibold text-text-tertiary uppercase">
                Due Date
              </p>
              <p
                className={`text-xs font-semibold ${
                  task.isOverdue && task.status !== "done"
                    ? "text-error-500"
                    : "text-text-primary"
                }`}
              >
                {task.dueDate || "No deadline set"}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-[11px] font-semibold text-text-tertiary uppercase">
                Estimate
              </p>
              <p className="text-xs font-semibold text-text-primary">
                {task.estimatedHours > 0 ? `${task.estimatedHours} hours` : "Not estimated"}
              </p>
            </div>
          </div>

          {task.description && (
            <div className="rounded-xl border border-card-border bg-background-soft-50 p-4 text-sm whitespace-pre-wrap text-text-primary">
              {task.description}
            </div>
          )}

          {Array.isArray(task.tags) && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {task.tags.map((tag) => (
                <Badge key={tag} color="gray" size="sm">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Subtasks Checklist */}
          {totalCount > 0 && (
            <div className="space-y-3 rounded-xl border border-card-border p-4">
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs font-semibold text-text-primary uppercase">
                  Deliverables Checklist ({doneCount}/{totalCount})
                </p>
                <div className="w-40">
                  <Progress progress={percent} withLabel />
                </div>
              </div>

              <div className="space-y-2">
                {task.subtasks.map((st) => (
                  <label
                    key={st.id}
                    className="flex cursor-pointer items-center gap-2.5 rounded-lg p-1.5 hover:bg-background-soft-100"
                  >
                    <input
                      type="checkbox"
                      checked={st.done}
                      onChange={() => toggleSubtask(st.id)}
                      className="size-4 cursor-pointer rounded border border-border-primary accent-primary-500"
                    />
                    <span
                      className={`text-sm ${
                        st.done
                          ? "text-text-tertiary line-through"
                          : "text-text-primary"
                      }`}
                    >
                      {st.title}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Activity & Comments */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-text-primary uppercase">
              Studio Activity Notes ({(task.comments || []).length})
            </p>

            {(task.comments || []).length > 0 && (
              <div className="max-h-44 space-y-2 overflow-y-auto pr-1">
                {task.comments.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-xl border border-card-border bg-background-soft-50 p-3 text-xs"
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span className="font-semibold text-text-primary">{c.author}</span>
                      <span className="text-[11px] text-text-tertiary">
                        {new Date(c.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap text-text-secondary">{c.text}</p>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleAddComment} className="space-y-2">
              <TextArea
                rows={2}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a production note or feedback..."
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  appearance="outline"
                  size="xs"
                  isDisabled={postingComment}
                  className="border px-3 py-1.5"
                >
                  {postingComment ? "Posting..." : "Post Note"}
                </Button>
              </div>
            </form>
          </div>
        </DialogBody>

        <DialogFooter className="flex flex-wrap items-center justify-between gap-2 border-t border-card-border pt-4">
          <ButtonGroup size="sm">
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(task);
              }}
            >
              Edit Task
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onDuplicate(task);
              }}
            >
              Duplicate
            </button>
          </ButtonGroup>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="danger"
              appearance="outline"
              size="sm"
              onPress={() => {
                onDelete(task.id);
                onClose();
              }}
              className="border px-3 py-1.5"
            >
              Delete
            </Button>
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
