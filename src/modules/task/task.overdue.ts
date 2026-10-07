import type { TaskStatus } from "@prisma/client";

/** Read-time overdue. Never stored. */
export function computeIsOverdue(
  status: TaskStatus,
  dueDate: Date | null,
  nowMs: number
): boolean {
  if (status !== "OPEN") return false;
  if (dueDate === null) return false;
  return dueDate.getTime() < nowMs;
}
