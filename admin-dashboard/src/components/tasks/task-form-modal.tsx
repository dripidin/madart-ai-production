"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarGroup } from "@/components/tailgrids/core/avatar";
import { Badge } from "@/components/tailgrids/core/badge";
import { Button } from "@/components/tailgrids/core/button";
import {
  Dialog,
  DialogBody,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/tailgrids/core/dialog";
import { Input } from "@/components/tailgrids/core/input";
import { Backdrop } from "@/components/tailgrids/core/overlay";
import { Separator } from "@/components/tailgrids/core/separator";
import { TextArea } from "@/components/tailgrids/core/text-area";
import {
  getInitials,
  STUDIO_PROJECTS,
  type TaskPriority,
  type TaskRecord,
  type TaskStatus,
  type TaskSubtask,
} from "./types";

interface TaskFormModalProps {
  isOpen: boolean;
  mode: "create" | "edit" | "duplicate";
  initialStatus?: TaskStatus;
  initialTask: TaskRecord | null;
  onClose: () => void;
  onSaved: () => void;
}

export function TaskFormModal({
  isOpen,
  mode,
  initialStatus = "todo",
  initialTask,
  onClose,
  onSaved,
}: TaskFormModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [project, setProject] = useState(STUDIO_PROJECTS[0]);
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [priority, setPriority] = useState<TaskPriority>("normal");
  const [dueDate, setDueDate] = useState("");
  const [estimatedHours, setEstimatedHours] = useState<string>("");
  const [assigneesInput, setAssigneesInput] = useState("Bidjou Mohamed");
  const [tagsInput, setTagsInput] = useState("");
  const [subtasks, setSubtasks] = useState<TaskSubtask[]>([]);
  const [newSubtask, setNewSubtask] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (initialTask && (mode === "edit" || mode === "duplicate")) {
      setTitle(
        mode === "duplicate" ? `${initialTask.title} (Copy)` : initialTask.title || ""
      );
      setDescription(initialTask.description || "");
      setProject(initialTask.project || STUDIO_PROJECTS[0]);
      setStatus(mode === "duplicate" ? "todo" : initialTask.status || "todo");
      setPriority(initialTask.priority || "normal");
      setDueDate(initialTask.dueDate || "");
      setEstimatedHours(
        initialTask.estimatedHours ? String(initialTask.estimatedHours) : ""
      );
      setAssigneesInput(
        Array.isArray(initialTask.assignees) && initialTask.assignees.length > 0
          ? initialTask.assignees.join(", ")
          : initialTask.assignee || "Bidjou Mohamed"
      );
      setTagsInput(
        Array.isArray(initialTask.tags) ? initialTask.tags.join(", ") : ""
      );
      setSubtasks(
        Array.isArray(initialTask.subtasks)
          ? initialTask.subtasks.map((s, idx) => ({
              id: `sub_${Date.now()}_${idx}`,
              title: s.title,
              done: mode === "duplicate" ? false : Boolean(s.done),
            }))
          : []
      );
      setNewSubtask("");
    } else {
      setTitle("");
      setDescription("");
      setProject(STUDIO_PROJECTS[0]);
      setStatus(initialStatus || "todo");
      setPriority("normal");
      setDueDate("");
      setEstimatedHours("");
      setAssigneesInput("Bidjou Mohamed");
      setTagsInput("");
      setSubtasks([]);
      setNewSubtask("");
    }
  }, [isOpen, mode, initialStatus, initialTask]);

  const parsedAssignees = assigneesInput
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const parsedTags = tagsInput
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const addSubtask = () => {
    const trimmed = newSubtask.trim();
    if (!trimmed) return;
    setSubtasks((prev) => [
      ...prev,
      { id: `sub_${Date.now()}_${prev.length}`, title: trimmed, done: false },
    ]);
    setNewSubtask("");
  };

  const toggleSubtask = (idx: number) => {
    setSubtasks((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, done: !s.done } : s))
    );
  };

  const removeSubtask = (idx: number) => {
    setSubtasks((prev) => prev.filter((_, i) => i !== idx));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Task title is required.");
      return;
    }

    setSaving(true);
    try {
      const assignees =
        parsedAssignees.length > 0 ? parsedAssignees : ["Bidjou Mohamed"];
      const payload = {
        ...(mode === "edit" && initialTask ? { id: initialTask.id } : {}),
        title: title.trim(),
        description: description.trim(),
        project,
        status,
        priority,
        dueDate,
        estimatedHours: Math.max(0, Number(estimatedHours) || 0),
        assignee: assignees[0],
        assignees,
        tags: parsedTags,
        subtasks,
      };

      const res = await fetch("/api/tasks", {
        method: mode === "edit" ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save task.");

      toast.success(
        mode === "edit" ? "Updated studio task." : "Added new task to board."
      );
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed saving task.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Backdrop isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog className="max-h-[90vh] max-w-2xl overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit"
              ? "Edit Studio Task"
              : mode === "duplicate"
              ? "Duplicate Studio Task"
              : "Create Studio Task"}
          </DialogTitle>
          <DialogDescription>
            Assign collaborators, production deliverables checklist, deadlines, and priority.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <DialogBody className="space-y-5">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-primary">
                Task Title *
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Finalize Dior AI Spec Spot color grade"
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-primary">
                  Production Track
                </label>
                <select
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                  className="h-10 w-full rounded-lg border border-card-border bg-input-background px-3 text-sm text-text-primary outline-none focus:border-primary-500"
                >
                  {STUDIO_PROJECTS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-primary">
                  Stage
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TaskStatus)}
                  className="h-10 w-full rounded-lg border border-card-border bg-input-background px-3 text-sm text-text-primary outline-none focus:border-primary-500"
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Completed</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-primary">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className="h-10 w-full rounded-lg border border-card-border bg-input-background px-3 text-sm text-text-primary outline-none focus:border-primary-500"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-primary">
                  Est. Hours
                </label>
                <Input
                  type="number"
                  min={0}
                  step="0.5"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(e.target.value)}
                  placeholder="4"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-primary">
                  Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="h-10 w-full rounded-lg border border-card-border bg-input-background px-3 text-sm text-text-primary outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-xs font-medium text-text-primary">
                    Assignees (comma-separated)
                  </label>
                  {parsedAssignees.length > 0 && (
                    <AvatarGroup>
                      {parsedAssignees.slice(0, 3).map((person) => (
                        <Avatar key={person} size="xs">
                          <AvatarFallback>{getInitials(person)}</AvatarFallback>
                        </Avatar>
                      ))}
                    </AvatarGroup>
                  )}
                </div>
                <Input
                  value={assigneesInput}
                  onChange={(e) => setAssigneesInput(e.target.value)}
                  placeholder="Bidjou Mohamed, Sara K."
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-primary">
                Brief &amp; Production Notes
              </label>
              <TextArea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Shot references, sound stems, frame-rate notes..."
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-primary">
                Tags (comma-separated)
              </label>
              <Input
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="VFX, 4K Master, Sound Design"
              />
              {parsedTags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {parsedTags.map((tag) => (
                    <Badge key={tag} color="gray" size="sm">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Subtask Checklist Builder */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-text-primary uppercase">
                  Subtasks Checklist ({subtasks.length})
                </label>
              </div>

              <div className="flex gap-2">
                <Input
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSubtask();
                    }
                  }}
                  placeholder="Add deliverable step (e.g., Export ProRes 422 HQ)..."
                />
                <Button
                  type="button"
                  appearance="outline"
                  onPress={addSubtask}
                  className="shrink-0 border px-3 py-2"
                >
                  + Add Step
                </Button>
              </div>

              {subtasks.length > 0 && (
                <div className="space-y-1.5 rounded-xl border border-card-border bg-background-soft-50 p-3">
                  {subtasks.map((st, idx) => (
                    <div
                      key={st.id}
                      className="flex items-center justify-between gap-2 rounded-lg px-2 py-1 hover:bg-card-background"
                    >
                      <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={st.done}
                          onChange={() => toggleSubtask(idx)}
                          className="size-4 rounded border border-border-primary accent-primary-500"
                        />
                        <span
                          className={`truncate ${
                            st.done
                              ? "text-text-tertiary line-through"
                              : "text-text-primary"
                          }`}
                        >
                          {st.title}
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={() => removeSubtask(idx)}
                        className="rounded px-1.5 py-0.5 text-xs text-error-500 hover:bg-error-50"
                        aria-label={`Remove subtask ${st.title}`}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogBody>

          <DialogFooter className="border-t border-card-border pt-4">
            <Button
              type="button"
              appearance="outline"
              onPress={onClose}
              className="border px-4 py-2"
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isDisabled={saving}>
              {saving
                ? "Saving Task..."
                : mode === "edit"
                ? "Save Changes"
                : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </Backdrop>
  );
}
