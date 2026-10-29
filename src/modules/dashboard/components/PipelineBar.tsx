import type { PipelineStage } from "@/modules/dashboard/dashboard.service";

const COLORS = [
  "bg-sky-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-slate-500",
];

export function PipelineBar({ stages }: { stages: PipelineStage[] }) {
  const total = stages.reduce((s, x) => s + x.count, 0) || 1;
  return (
    <div className="space-y-3">
      <div className="flex h-9 w-full overflow-hidden rounded-md">
        {stages.map((stage, i) => {
          const pct = Math.max((stage.count / total) * 100, stage.count > 0 ? 4 : 0);
          if (stage.count === 0) return null;
          return (
            <div
              key={stage.status}
              className={`${COLORS[i % COLORS.length]} flex items-center justify-center px-1 text-[10px] font-medium text-white sm:text-xs`}
              style={{ width: `${pct}%` }}
              title={`${stage.label}: ${stage.count}`}
            >
              {pct >= 12 ? `${stage.label} (${stage.count})` : stage.count}
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        {stages.map((stage, i) => (
          <span key={stage.status} className="inline-flex items-center gap-1.5">
            <span className={`size-2 rounded-full ${COLORS[i % COLORS.length]}`} />
            {stage.label}: {stage.count}
          </span>
        ))}
      </div>
    </div>
  );
}
