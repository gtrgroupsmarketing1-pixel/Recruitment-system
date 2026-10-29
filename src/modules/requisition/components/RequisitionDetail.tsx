import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RequisitionView } from "@/modules/requisition/requisition.service";
import type { ApplicationListItem } from "@/modules/application/components/ApplicationList";
import { PipelineBoard } from "@/modules/application/components/PipelineBoard";
import {
  updateRequisitionAction,
  deleteRequisitionAction,
} from "@/modules/requisition/update.action";
import { FulfillmentBar } from "./FulfillmentBar";
import { ReqStatusBadge } from "./ReqStatusBadge";
import { SlaBadge } from "./SlaBadge";
import { formatOnboarding } from "./format";
import { buttonVariants } from "@/components/ui/button";
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

export function RequisitionDetail({ data, recentAudit, applications }: Props) {
  const onboard = data.targetOnboardingDate
    ? formatOnboarding(data.targetOnboardingDate.toISOString())
    : "—";
  const title = jobTitle(data);
  const onboardInput = data.targetOnboardingDate
    ? data.targetOnboardingDate.toISOString().slice(0, 10)
    : "";

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <ReqStatusBadge status={data.status} />
            <SlaBadge flag={data.slaFlag} />
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
        </div>
      </div>

      {/* Pipeline full width */}
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

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Edit requisition</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={updateRequisitionAction} className="grid gap-3">
              <input type="hidden" name="id" value={data.id} />
              <label className="grid gap-1 text-sm">
                Role category code
                <input
                  name="roleCategory"
                  defaultValue={data.roleCategory}
                  className="h-8 rounded-lg border border-input bg-background px-2 font-mono uppercase"
                />
              </label>
              <label className="grid gap-1 text-sm">
                Country
                <select
                  name="country"
                  defaultValue={data.country}
                  className="h-8 rounded-lg border border-input bg-background px-2"
                >
                  {["AE", "SA", "QA", "KW", "BH", "OM"].map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-sm">
                Vacancy target
                <input
                  name="vacancyTarget"
                  type="number"
                  min={1}
                  defaultValue={data.vacancyTarget}
                  className="h-8 rounded-lg border border-input bg-background px-2"
                />
              </label>
              <label className="grid gap-1 text-sm">
                Location
                <input
                  name="location"
                  defaultValue={data.location ?? ""}
                  className="h-8 rounded-lg border border-input bg-background px-2"
                />
              </label>
              <label className="grid gap-1 text-sm">
                Target onboarding
                <input
                  name="targetOnboardingDate"
                  type="date"
                  defaultValue={onboardInput}
                  className="h-8 rounded-lg border border-input bg-background px-2"
                />
              </label>
              <label className="grid gap-1 text-sm">
                Status
                <select
                  name="status"
                  defaultValue={data.status}
                  className="h-8 rounded-lg border border-input bg-background px-2"
                >
                  {["OPEN", "IN_PROGRESS", "FILLED", "CANCELLED", "ON_HOLD"].map(
                    (s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    )
                  )}
                </select>
              </label>
              <label className="grid gap-1 text-sm">
                Notes
                <input
                  name="notes"
                  defaultValue={data.notes ?? ""}
                  className="h-8 rounded-lg border border-input bg-background px-2"
                />
              </label>
              <button
                type="submit"
                className={cn(buttonVariants({ variant: "default" }), "w-fit")}
              >
                Save changes
              </button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
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
                    <li key={entry.id} className="border-b border-border/50 pb-2 last:border-0">
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

          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="text-destructive">Danger zone</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={deleteRequisitionAction}>
                <input type="hidden" name="id" value={data.id} />
                <p className="mb-3 text-xs text-muted-foreground">
                  Soft-delete hides this requisition from lists.
                </p>
                <button
                  type="submit"
                  className={cn(buttonVariants({ variant: "destructive" }))}
                >
                  Delete requisition
                </button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
