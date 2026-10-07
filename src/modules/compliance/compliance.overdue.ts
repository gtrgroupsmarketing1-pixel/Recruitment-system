export function computeChecklistOverdue(
  status: string,
  dueDate: Date | null,
  nowMs: number
): boolean {
  if (status === "COMPLETE") return false;
  if (!dueDate) return false;
  return dueDate.getTime() < nowMs;
}

export function computeStageLocked(predecessorStatus: string | null): boolean {
  if (predecessorStatus === null) return false;
  return predecessorStatus !== "COMPLETE";
}
