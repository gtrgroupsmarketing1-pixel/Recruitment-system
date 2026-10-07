"use client";

import type { TaskView } from "@/modules/task/task.service";
import { completeTaskAction } from "@/modules/task/complete.action";
import { OverdueBadge } from "./OverdueBadge";
import { TaskPriorityDot } from "./TaskPriorityDot";

type Props = { task: TaskView };

export function TaskRow({ task }: Props) {
  const due = task.dueDate
    ? task.dueDate.toISOString().slice(0, 10)
    : "No due date";
  return (
    <li className="flex items-start gap-3 border-b py-2">
      <form action={completeTaskAction}>
        <input type="hidden" name="taskId" value={task.id} />
        <button
          type="submit"
          className="mt-1 h-4 w-4 rounded border"
          aria-label={`Complete ${task.title}`}
          disabled={task.status === "COMPLETED"}
        />
      </form>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <TaskPriorityDot priority={task.priority} />
          <span className="font-medium">{task.title}</span>
          <OverdueBadge isOverdue={task.isOverdue} />
        </div>
        <p className="text-xs text-neutral-500">
          {task.priority} · due {due} · {task.refType}/{task.refId.slice(0, 8)}
        </p>
      </div>
    </li>
  );
}
