import type { TaskCounts } from "@/modules/task/task.service";

type Props = { counts: TaskCounts };

export function TaskCountsRow({ counts }: Props) {
  const cells = [
    { label: "Today", value: counts.today },
    { label: "Overdue", value: counts.overdue },
    { label: "This week", value: counts.thisWeek },
  ];
  return (
    <div className="grid grid-cols-3 gap-2">
      {cells.map((c) => (
        <div key={c.label} className="rounded border p-3 text-center">
          <p className="text-2xl font-semibold">{c.value}</p>
          <p className="text-xs text-neutral-500">{c.label}</p>
        </div>
      ))}
    </div>
  );
}
