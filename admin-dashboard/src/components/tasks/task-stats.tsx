"use client";

import {
  Alert,
  AlertContent,
  AlertDescription,
  AlertIndicator,
  AlertTitle,
} from "@/components/tailgrids/core/alert";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/tailgrids/core/card";
import { Progress } from "@/components/tailgrids/core/progress";
import {
  BoxIcon,
  EyeIcon,
  UserGroupIcon,
} from "@/app/(with-layouts)/(dashboard)/(home)/_component/overview-stats/icons";
import { type TaskRecord } from "./types";

export function TaskStats({ tasks }: { tasks: TaskRecord[] }) {
  const totalCount = tasks.length;
  const todoCount = tasks.filter((t) => t.status === "todo").length;
  const inProgressCount = tasks.filter((t) => t.status === "in_progress").length;
  const doneCount = tasks.filter((t) => t.status === "done").length;
  const highPriorityOpen = tasks.filter(
    (t) => t.status !== "done" && t.priority === "high"
  ).length;
  const overdueTasks = tasks.filter((t) => t.isOverdue && t.status !== "done");
  const queuedHours = tasks
    .filter((t) => t.status !== "done")
    .reduce((acc, t) => acc + Number(t.estimatedHours || 0), 0);

  const completionPercent =
    totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
        {/* Overall Progress */}
        <Card>
          <CardHeader>
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary-500/10 text-primary-500">
              <BoxIcon />
            </div>
            <span className="text-xs font-medium text-text-tertiary">
              {doneCount} / {totalCount} done
            </span>
          </CardHeader>
          <CardContent className="mt-5 p-0">
            <div className="mb-1.5 text-xl leading-7 font-semibold text-text-primary md:text-2xl">
              {totalCount} Tasks
            </div>
            <Progress progress={completionPercent} withLabel className="max-w-full" />
          </CardContent>
          <CardFooter className="mt-2 flex items-center justify-between p-0">
            <span className="text-sm font-medium text-text-tertiary">Completion Rate</span>
            <span className="text-xs font-medium text-primary-500">Studio Sprint</span>
          </CardFooter>
        </Card>

        {/* Queued To Do */}
        <Card>
          <CardHeader>
            <div className="flex size-8 items-center justify-center rounded-lg bg-gray-500/10 text-text-secondary">
              <EyeIcon />
            </div>
            <span className="text-xs font-medium text-text-tertiary">
              {queuedHours > 0 ? `${queuedHours}h est.` : "Backlog"}
            </span>
          </CardHeader>
          <CardContent className="mt-5 p-0">
            <div className="mb-1 text-xl leading-7 font-semibold text-text-primary md:text-2xl">
              {todoCount}
            </div>
          </CardContent>
          <CardFooter className="mt-4 flex items-center justify-between p-0">
            <span className="text-sm font-medium text-text-tertiary">To Do Queue</span>
            <span className="text-xs font-medium text-text-tertiary">Ready to pick</span>
          </CardFooter>
        </Card>

        {/* In Progress */}
        <Card>
          <CardHeader>
            <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
              <UserGroupIcon />
            </div>
            <span className="text-xs font-medium text-error-500">
              {highPriorityOpen} high priority
            </span>
          </CardHeader>
          <CardContent className="mt-5 p-0">
            <div className="mb-1 text-xl leading-7 font-semibold text-text-primary md:text-2xl">
              {inProgressCount}
            </div>
          </CardContent>
          <CardFooter className="mt-4 flex items-center justify-between p-0">
            <span className="text-sm font-medium text-text-tertiary">In Production</span>
            <span className="text-xs font-medium text-blue-500">Active Work</span>
          </CardFooter>
        </Card>

        {/* Overdue / Urgent */}
        <Card>
          <CardHeader>
            <div className="flex size-8 items-center justify-center rounded-lg bg-error-500/10 text-error-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <span className="text-xs font-medium text-text-tertiary">
              Deadlines
            </span>
          </CardHeader>
          <CardContent className="mt-5 p-0">
            <div
              className={`mb-1 text-xl leading-7 font-semibold md:text-2xl ${
                overdueTasks.length > 0 ? "text-error-500" : "text-text-primary"
              }`}
            >
              {overdueTasks.length}
            </div>
          </CardContent>
          <CardFooter className="mt-4 flex items-center justify-between p-0">
            <span className="text-sm font-medium text-text-tertiary">Overdue Tasks</span>
            <span className="text-xs font-medium text-text-tertiary">
              {overdueTasks.length === 0 ? "On schedule" : "Needs attention"}
            </span>
          </CardFooter>
        </Card>
      </div>

      {overdueTasks.length > 0 && (
        <Alert status="warning" className="max-w-full">
          <AlertIndicator />
          <AlertContent>
            <AlertTitle>
              {overdueTasks.length} Overdue {overdueTasks.length === 1 ? "Task" : "Tasks"} Past Due Date
            </AlertTitle>
            <AlertDescription>
              Check the <strong>High Priority &amp; Overdue</strong> tab or update deadlines for:{" "}
              <strong className="text-text-primary">
                {overdueTasks
                  .slice(0, 3)
                  .map((t) => t.title)
                  .join(", ")}
                {overdueTasks.length > 3 ? ` +${overdueTasks.length - 3} more` : ""}
              </strong>
              .
            </AlertDescription>
          </AlertContent>
        </Alert>
      )}
    </div>
  );
}
