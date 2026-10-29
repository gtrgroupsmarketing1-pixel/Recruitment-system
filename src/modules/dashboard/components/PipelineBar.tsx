import type { PipelineStage } from "@/modules/dashboard/dashboard.service";

const COLORS = [
  "bg-sky-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-slate-600",
];

export function PipelineBar({ stages }: { stages: PipelineStage[] }) {
  const total = stages.reduce((s, x) => s + x.count, 0);
  const max = Math.max(...stages.map((s) => s.count), 1);

  return (
    <div className="space-y-4">
      {/* Stacked proportional bar */}
      <div className="flex h-10 w-full overflow-hidden rounded-md bg-muted">
        {total === 0 ? (
          <div className="flex w-full items-center justify-center text-xs text-muted-foreground">
            No active applications yet
          </div>
        ) : (
          stages.map((stage, i) => {
            if (stage.count === 0) return null;
            const pct = (stage.count / total) * 100;
            return (
              <div
                key={stage.status}
                className={`${COLORS[i % COLORS.length]} flex items-center justify-center px-1 text-[10px] font-medium text-white sm:text-xs`}
                style={{ width: `${Math.max(pct, 3)}%` }}
                title={`${stage.label}: ${stage.count}`}
              >
                {pct >= 14 ? `${stage.label} (${stage.count})` : stage.count}
              </div>
            );
          })
        )}
      </div>

      {/* Drop-off bars — always show all stages */}
      <div className="grid gap-2 sm:grid-cols-5">
        {stages.map((stage, i) => {
          const h = Math.round((stage.count / max) * 100);
          return (
            <div key={stage.status} className="flex flex-col items-center gap-1">
              <span className="text-xs font-semibold tabular-nums">{stage.count}</span>
              <div className="flex h-16 w-full items-end justify-center rounded bg-muted/60 px-1">
                <div
                  className={`w-full max-w-[2.5rem] rounded-t ${COLORS[i % COLORS.length]} transition-all`}
                  style={{ height: `${Math.max(h, stage.count > 0 ? 8 : 0)}%` }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground text-center leading-tight">
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>
      {total > 0 ? (
        <p className="text-xs text-muted-foreground">
          {total} applications in active funnel · compare stage heights for bottlenecks
        </p>
      ) : null}
    </div>
  );
}
