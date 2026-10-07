type Props = { dueDate: Date | null; completed: boolean; isOverdue: boolean };

export function ChecklistSlaBadge({ dueDate, completed, isOverdue }: Props) {
  const tone = completed ? "bg-emerald-500" : isOverdue ? "bg-red-600" : "bg-amber-400";
  const label = dueDate ? dueDate.toISOString().slice(0, 10) : "no due date";
  return (
    <span className="inline-flex items-center gap-1 text-xs text-neutral-500">
      <span className={`inline-block h-2 w-2 rounded-full ${tone}`} />
      {label}
    </span>
  );
}
