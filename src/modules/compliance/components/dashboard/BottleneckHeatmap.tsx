import type { BottleneckEntry } from "@/modules/compliance/compliance.dashboard.service";

type Props = { entries: BottleneckEntry[] };

export function BottleneckHeatmap({ entries }: Props) {
  return (
    <ul className="space-y-2 text-sm">
      {entries.map((entry) => (
        <li key={`${entry.stepOrder}-${entry.stepName}`}>
          <div className="flex justify-between"><span>{entry.stepName}</span><span>{entry.pctStuck.toFixed(0)}%</span></div>
          <div className="h-2 bg-neutral-200"><div className="h-2 bg-red-600" style={{ width: `${Math.min(100, entry.pctStuck)}%` }} /></div>
        </li>
      ))}
    </ul>
  );
}
