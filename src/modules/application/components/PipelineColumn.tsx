import type { ApplicationStatus } from "@prisma/client";
import type { ApplicationListItem } from "./ApplicationList";
import { PipelineCard } from "./PipelineCard";

type Props = {
  status: ApplicationStatus;
  items: ApplicationListItem[];
};

export function PipelineColumn({ status, items }: Props) {
  return (
    <div className="flex min-h-[120px] flex-col rounded border bg-neutral-50 p-2">
      <header className="mb-2 flex items-center justify-between gap-2 border-b pb-1">
        <span className="text-xs font-semibold uppercase tracking-wide">
          {status}
        </span>
        <span className="text-xs text-neutral-500">{items.length}</span>
      </header>
      <div className="flex flex-col gap-2">
        {items.length === 0 ? (
          <p className="text-center text-xs text-neutral-400">—</p>
        ) : (
          items.map((application) => (
            <PipelineCard key={application.id} application={application} />
          ))
        )}
      </div>
    </div>
  );
}
