"use client";

import Link from "next/link";
import { useOptimistic, useTransition } from "react";
import { formatDistanceToNow, isPast, isToday } from "date-fns";
import type { TaskView } from "@/modules/task/task.service";
import { completeTaskAction } from "@/modules/task/complete.action";
import { Badge } from "@/components/ui/badge";
import { cn } from "cn";

type Props = { initialTasks: TaskView[]; emptyMessage?: string };

function contextHref(refType: string, refId: string): string | null {
  const t = refType.toLowerCase();
  if (t.includes("requisition") || t === "jobrequisition") {
    return `/requisitions/${refId}`;
  }
  if (t.includes("candidate")) {
    return `/candidates/${refId}`;
  }
  if (t.includes("application")) {
    return `/candidates`; // no dedicated application page
  }
  return null;
}

function priorityClass(priority: TaskView["priority"]): string {
  if (priority === "URGENT" || priority === "HIGH") return "bg-red-500";
  if (priority === "MEDIUM") return "bg-amber-500";
  return "bg-sky-500";
}

export function TaskActionList({ initialTasks, emptyMessage }: Props) {
  const [pending, startTransition] = useTransition();
  const [tasks, removeOptimistic] = useOptimistic(
    initialTasks,
    (state, taskId: string) => state.filter((t) => t.id !== taskId)
  );

  const onComplete = (taskId: string) => {
    startTransition(async () => {
      removeOptimistic(taskId);
      const fd = new FormData();
      fd.set("taskId", taskId);
      await completeTaskAction(fd);
    });
  };

  if (tasks.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/30 px-6 py-12 text-center">
        <p className="text-sm text-muted-foreground">
          {emptyMessage ?? "No tasks found. You are all caught up."}
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y overflow-hidden rounded-lg border bg-card">
      {tasks.map((task) => {
        const href = contextHref(task.refType, task.refId);
        const due = task.dueDate;
        const overdue =
          task.isOverdue ||
          (due != null && isPast(due) && !isToday(due) && task.status !== "COMPLETED");

        return (
          <div
            key={task.id}
            className={cn(
              "flex items-start gap-3 p-4 transition-colors hover:bg-muted/40",
              pending && "opacity-80"
            )}
          >
            <button
              type="button"
              disabled={pending || task.status === "COMPLETED"}
              onClick={() => onComplete(task.id)}
              className="mt-1 flex size-4 shrink-0 items-center justify-center rounded border border-input bg-background hover:bg-muted disabled:opacity-50"
              aria-label={`Complete ${task.title}`}
            />
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn("size-2 shrink-0 rounded-full", priorityClass(task.priority))}
                  title={task.priority}
                />
                <span className="font-medium">{task.title}</span>
                <Badge
                  variant={
                    task.priority === "HIGH" || task.priority === "URGENT"
                      ? "destructive"
                      : "secondary"
                  }
                  className="text-[10px]"
                >
                  {task.priority}
                </Badge>
                {overdue ? (
                  <Badge variant="destructive" className="text-[10px]">
                    Overdue
                  </Badge>
                ) : null}
              </div>
              {task.description ? (
                <p className="text-sm text-muted-foreground">{task.description}</p>
              ) : null}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {href ? (
                  <Link href={href}>
                    <Badge
                      variant="outline"
                      className="cursor-pointer text-xs font-normal hover:bg-muted"
                    >
                      {task.refType}: {task.refId.slice(-8)}
                    </Badge>
                  </Link>
                ) : (
                  <Badge variant="outline" className="text-xs font-normal">
                    {task.refType}/{task.refId.slice(0, 8)}
                  </Badge>
                )}
                <span
                  className={cn(
                    "ml-auto text-xs font-medium",
                    overdue ? "text-destructive" : "text-muted-foreground"
                  )}
                >
                  {due
                    ? `${overdue ? "Overdue · " : "Due "}${formatDistanceToNow(due, { addSuffix: true })}`
                    : "No due date"}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
