"use client";

import { useOptimistic, useTransition } from "react";
import type { TaskView } from "@/modules/task/task.service";
import { completeTaskAction } from "@/modules/task/complete.action";

type Props = { initialTasks: TaskView[] };

export function DashboardTaskList({ initialTasks }: Props) {
  const [pending, startTransition] = useTransition();
  const [tasks, setOptimistic] = useOptimistic(
    initialTasks,
    (state, taskId: string) => state.filter((t) => t.id !== taskId)
  );

  const onComplete = (taskId: string) => {
    startTransition(async () => {
      setOptimistic(taskId);
      const fd = new FormData();
      fd.set("taskId", taskId);
      await completeTaskAction(fd);
    });
  };

  if (tasks.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">You&apos;re all caught up.</p>
    );
  }

  return (
    <ul className="space-y-3">
      {tasks.map((task) => (
        <li key={task.id} className="flex items-start gap-3">
          <button
            type="button"
            disabled={pending}
            onClick={() => onComplete(task.id)}
            className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border border-input bg-background hover:bg-muted disabled:opacity-50"
            aria-label={`Complete ${task.title}`}
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium leading-snug">{task.title}</p>
            <p className="text-xs text-muted-foreground">
              {task.isOverdue ? (
                <span className="text-destructive">Overdue</span>
              ) : task.dueDate ? (
                `Due ${task.dueDate.toISOString().slice(0, 10)}`
              ) : (
                "No due date"
              )}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
