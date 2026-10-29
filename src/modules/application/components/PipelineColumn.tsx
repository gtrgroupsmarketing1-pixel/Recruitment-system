import type { ApplicationStatus } from "@prisma/client";
import type { ApplicationListItem } from "./ApplicationList";
import { PipelineCard } from "./PipelineCard";

type Props = {
  status: ApplicationStatus;
  items: ApplicationListItem[];
};

export function PipelineColumn({ status, items }: Props) {
  void status;
  return (
    <div className="flex min-h-[220px] flex-col gap-2 rounded-lg border border-dashed bg-background/80 p-2">
      {items.length === 0 ? (
        <p className="flex flex-1 items-center justify-center py-8 text-center text-xs text-muted-foreground">
          Empty
        </p>
      ) : (
        items.map((application) => (
          <PipelineCard key={application.id} application={application} />
        ))
      )}
    </div>
  );
}
