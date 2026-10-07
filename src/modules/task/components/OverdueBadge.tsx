type Props = { isOverdue: boolean };

export function OverdueBadge({ isOverdue }: Props) {
  if (!isOverdue) return null;
  return (
    <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-800">
      OVERDUE
    </span>
  );
}
