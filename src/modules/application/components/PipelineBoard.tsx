import Link from "next/link";
import { PIPELINE_ORDER } from "@/modules/application/application.status-order";
import type { ApplicationListItem } from "./ApplicationList";
import { PipelineColumn } from "./PipelineColumn";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";

type Props = {
  applications: ApplicationListItem[];
  requisitionId: string;
};

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

  const activeStatuses = PIPELINE_ORDER.filter((status) =>
    applications.some((row) => row.status === status)
  );
  // Always show early stages so recruiters can see the funnel even if empty mid-pipeline
  const early = ["SOURCED", "SCREENED", "SHORTLISTED"] as const;
  const columns = PIPELINE_ORDER.filter(
    (s) => activeStatuses.includes(s) || early.includes(s as (typeof early)[number])
  );

  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="flex min-w-max gap-3">
        {columns.map((status) => {
          const items = applications.filter((row) => row.status === status);
          return (
            <div key={status} className="w-64 shrink-0">
              <PipelineColumn status={status} items={items} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
