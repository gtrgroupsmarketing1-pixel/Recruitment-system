import Link from "next/link";
import { PIPELINE_ORDER } from "@/modules/application/application.status-order";
import type { ApplicationListItem } from "./ApplicationList";
import { PipelineColumn } from "./PipelineColumn";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "cn";

type Props = {
  applications: ApplicationListItem[];
  requisitionId: string;
};

function labelFor(status: string): string {
  return status.replace(/_/g, " ");
}

export function PipelineBoard({ applications, requisitionId }: Props) {
  if (applications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 px-6 py-12 text-center">
        <h3 className="text-base font-semibold">No candidates yet</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Start sourcing to fill this requisition. Add one candidate or bulk-import.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Link
            href={`/candidates/new?requisitionId=${requisitionId}`}
            className={cn(buttonVariants({ variant: "default" }))}
          >
            Add first candidate
          </Link>
          <Link
            href={`/candidates/bulk?requisitionId=${requisitionId}`}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Bulk import
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {applications.length} candidate{applications.length === 1 ? "" : "s"} in
          pipeline · scroll sideways for all stages
        </p>
        <Badge variant="secondary">{PIPELINE_ORDER.length} stages</Badge>
      </div>

      {/* Horizontal kanban — native overflow (no ScrollArea component in UI kit) */}
      <div className="w-full overflow-x-auto rounded-lg border bg-muted/20">
        <div className="flex w-max gap-3 p-4">
          {PIPELINE_ORDER.map((status) => {
            const items = applications.filter((row) => row.status === status);
            return (
              <div key={status} className="flex w-[280px] shrink-0 flex-col gap-2">
                <div className="flex items-center justify-between gap-2 px-1">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {labelFor(status)}
                  </h3>
                  <Badge variant="secondary" className="rounded-full px-2 py-0 text-[10px]">
                    {items.length}
                  </Badge>
                </div>
                <PipelineColumn status={status} items={items} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
