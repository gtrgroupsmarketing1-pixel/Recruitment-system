import Link from "next/link";
import type { RequisitionView } from "@/modules/requisition/requisition.service";
import { ReqStatusBadge } from "./ReqStatusBadge";
import { SlaBadge } from "./SlaBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";

type Props = { data: RequisitionView[] };

function jobTitle(req: RequisitionView): string {
  const fromNotes = req.notes?.trim();
  if (fromNotes) {
    const titleLine = fromNotes
      .split("\n")
      .find((l) => /^title\s*:/i.test(l));
    if (titleLine) return titleLine.replace(/^title\s*:\s*/i, "").trim();
    return fromNotes.split("\n")[0]!.slice(0, 80);
  }
  return req.roleCategory;
}

export function RequisitionList({ data }: Props) {
  if (data.length === 0) {
    return (
      <EmptyState
        title="No requisitions"
        description="Create a job requisition to start sourcing."
        action={
          <Link
            href="/requisitions/new"
            className={cn(buttonVariants({ variant: "default" }))}
          >
            New requisition
          </Link>
        }
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Req code</TableHead>
            <TableHead>Job / role</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>SLA</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((req) => {
            const pct = Math.min(
              100,
              Math.round(
                (req.fulfillment.mobilized / Math.max(req.fulfillment.target, 1)) *
                  100
              )
            );
            return (
              <TableRow key={req.id}>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  <Link
                    href={`/requisitions/${req.id}`}
                    className="hover:underline"
                  >
                    {req.reqCode}
                  </Link>
                </TableCell>
                <TableCell className="max-w-[14rem]">
                  <Link
                    href={`/requisitions/${req.id}`}
                    className="font-medium hover:underline"
                  >
                    {jobTitle(req)}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {req.roleCategory} · {req.country}
                  </p>
                </TableCell>
                <TableCell className="max-w-[10rem] truncate">
                  {req.client.name}
                </TableCell>
                <TableCell>
                  <ReqStatusBadge status={req.status} />
                </TableCell>
                <TableCell>
                  <SlaBadge flag={req.slaFlag} />
                </TableCell>
                <TableCell className="min-w-[9rem]">
                  <div className="flex items-center gap-2">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="whitespace-nowrap text-xs text-muted-foreground tabular-nums">
                      {req.fulfillment.mobilized}/{req.fulfillment.target}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Link
                    href={`/candidates/new?requisitionId=${req.id}`}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    + Candidate
                  </Link>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
