import Link from "next/link";
import { differenceInCalendarDays } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RequisitionView } from "@/modules/requisition/requisition.service";
import type { ApplicationListItem } from "@/modules/application/components/ApplicationList";
import { PipelineBoard } from "@/modules/application/components/PipelineBoard";
import { FulfillmentBar } from "./FulfillmentBar";
import { ReqStatusBadge } from "./ReqStatusBadge";
import { EditRequisitionDialog } from "./EditRequisitionDialog";
import { formatOnboarding } from "./format";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "cn";

export type AuditLogEntry = {
  id: string;
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
  createdAt: Date;
};

type Props = {
  data: RequisitionView;
  recentAudit: AuditLogEntry[];
  applications: ApplicationListItem[];
};

function jobTitle(data: RequisitionView): string {
  const fromNotes = data.notes?.trim();
  if (fromNotes) {
    const titleLine = fromNotes
      .split("\n")
      .find((l) => /^title\s*:/i.test(l));
    if (titleLine) return titleLine.replace(/^title\s*:\s*/i, "").trim();
    return fromNotes.split("\n")[0]!.slice(0, 100);
  }
  return data.roleCategory;
}

function slaLabel(data: RequisitionView) {
  if (!data.targetOnboardingDate) return null;
  const days = differenceInCalendarDays(data.targetOnboardingDate, new Date());
  if (days < 0) {
    return (
      <Badge variant="destructive">{Math.abs(days)}d overdue</Badge>
    );
  }
  if (days <= 7) {
    return (
      <Badge className="bg-orange-500 text-white hover:bg-orange-500">
        {days}d left
      </Badge>
    );
  }
  return <Badge variant="secondary">{days}d left</Badge>;
}

export function RequisitionDetail({ data, recentAudit, applications }: Props) {
  const onboard = data.targetOnboardingDate
    ? formatOnboarding(data.targetOnboardingDate.toISOString())
    : "—";
  const title = jobTitle(data);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <ReqStatusBadge status={data.status} />
            {slaLabel(data)}
          </div>
          <p className="font-mono text-sm text-muted-foreground">{data.reqCode}</p>
          <p className="text-base text-muted-foreground">
            Client:{" "}
            <span className="font-medium text-foreground">
              {data.client.name}
            </span>
            <span className="text-muted-foreground">
              {" "}
              · {data.country} · {data.roleCategory}
            </span>
          </p>
          <p className="text-sm text-muted-foreground">
            Target onboarding: {onboard}
            {" · "}
            Recruiter: {data.assignedRecruiterId ?? "Unassigned"}
          </p>
          <div className="max-w-md pt-1">
            <FulfillmentBar
              mobilized={data.fulfillment.mobilized}
              target={data.fulfillment.target}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/candidates/new?requisitionId=${data.id}`}
            className={cn(buttonVariants({ variant: "default" }))}
          >
            Add candidate
          </Link>
          <Link
            href={`/candidates/bulk?requisitionId=${data.id}`}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Bulk import
          </Link>
          <EditRequisitionDialog data={data} />
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Pipeline</CardTitle>
          <Link
            href={`/candidates/bulk?requisitionId=${data.id}`}
            className="text-xs text-primary hover:underline"
          >
            Bulk status
          </Link>
        </CardHeader>
        <CardContent>
          <PipelineBoard
            applications={applications}
            requisitionId={data.id}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
        </CardHeader>
        <CardContent>
          {recentAudit.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No status changes yet.
            </p>
          ) : (
            <ul className="space-y-2 text-sm">
              {recentAudit.map((entry) => (
                <li
                  key={entry.id}
                  className="border-b border-border/50 pb-2 last:border-0"
                >
                  <time
                    dateTime={entry.createdAt.toISOString()}
                    className="text-xs text-muted-foreground"
                  >
                    {entry.createdAt
                      .toISOString()
                      .slice(0, 16)
                      .replace("T", " ")}
                  </time>
                  <p>
                    {entry.oldValue ?? "—"} → {entry.newValue ?? "—"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
