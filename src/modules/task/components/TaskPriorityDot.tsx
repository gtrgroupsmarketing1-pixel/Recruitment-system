import type { TaskPriority } from "@prisma/client";

type Props = { priority: TaskPriority };

const COLOR: Record<TaskPriority, string> = {
  LOW: "bg-neutral-300",
  MEDIUM: "bg-amber-400",
  HIGH: "bg-orange-500",
  URGENT: "bg-red-600",
};

export function TaskPriorityDot({ priority }: Props) {
  return (
    <span
      className={`inline-block h-2 w-2 rounded-full ${COLOR[priority]}`}
      title={priority}
      aria-label={priority}
    />
  );
}
