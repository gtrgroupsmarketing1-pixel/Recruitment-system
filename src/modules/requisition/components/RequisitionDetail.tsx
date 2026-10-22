import Link from "next/link";
import { Card } from "@/components/ui/card";
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

export function RequisitionDetail({ data, recentAudit, applications }: Props) {
  const onboard = data.targetOnboardingDate
    ? formatOnboarding(data.targetOnboardingDate.toISOString())
    : "—";
  const title = data.jobTitle?.trim() || data.roleCategory;
  const onboardInput = data.targetOnboardingDate
    ? data.targetOnboardingDate.toISOString().slice(0, 10)
    : "";

  return (
    <div className="grid gap-4">
      <Card className="space-y-4 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold">{title}</h1>
            <span className="font-mono text-sm text-muted-foreground">{data.reqCode}</span>
            <ReqStatusBadge status={data.status} />
            <SlaBadge flag={data.slaFlag} />
          </div>
          <p className="text-sm">
            {data.client.name} ({data.client.code}) · {data.country} ·{" "}
            {data.roleCategory}
          </p>
          <p className="text-sm">Target onboarding: {onboard}</p>
          <p className="text-sm">
            Recruiter: {data.assignedRecruiterId ?? "Unassigned"}
          </p>
          <div>
            <FulfillmentBar
              mobilized={data.fulfillment.mobilized}
              target={data.fulfillment.target}
            />
          </div>
          <p className="text-sm">{data.notes ?? "No notes."}</p>

          <form
            action={updateRequisitionAction}
            className="grid max-w-lg gap-2 rounded border p-3"
          >
            <input type="hidden" name="id" value={data.id} />
            <p className="text-sm font-medium">Edit requisition</p>
            <label className="grid gap-1 text-sm">
              Job title
              <input
                name="jobTitle"
                defaultValue={data.jobTitle ?? ""}
                className="rounded border px-2 py-1.5"
              />
            </label>
            <label className="grid gap-1 text-sm">
              Role category code
              <input
                name="roleCategory"
                defaultValue={data.roleCategory}
                className="rounded border px-2 py-1.5 font-mono uppercase"
              />
            </label>
            <label className="grid gap-1 text-sm">
              Country
              <select
                name="country"
                defaultValue={data.country}
                className="rounded border px-2 py-1.5"
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
                className="rounded border px-2 py-1.5"
              />
            </label>
            <label className="grid gap-1 text-sm">
              Location
              <input
                name="location"
                defaultValue={data.location ?? ""}
                className="rounded border px-2 py-1.5"
              />
            </label>
            <label className="grid gap-1 text-sm">
              Target onboarding
              <input
                name="targetOnboardingDate"
                type="date"
                defaultValue={onboardInput}
                className="rounded border px-2 py-1.5"
              />
            </label>
            <label className="grid gap-1 text-sm">
              Status
              <select
                name="status"
                defaultValue={data.status}
                className="rounded border px-2 py-1.5"
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
                className="rounded border px-2 py-1.5"
              />
            </label>
            <button
              type="submit"
              className="rounded bg-neutral-900 px-3 py-2 text-sm text-white"
            >
              Save changes
            </button>
          </form>

          <form action={deleteRequisitionAction} className="rounded border border-red-200 p-3">
            <input type="hidden" name="id" value={data.id} />
            <p className="mb-2 text-xs text-muted-foreground">
              Soft-delete hides this requisition from lists.
            </p>
            <button
              type="submit"
              className="rounded border border-red-300 px-3 py-1.5 text-sm text-red-700"
            >
              Delete requisition
            </button>
          </form>

          <h3 className="text-sm font-medium">Recent activity</h3>
          {recentAudit.length === 0 ? (
            <p className="text-sm text-neutral-500">No status changes yet.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {recentAudit.map((entry) => (
                <li key={entry.id}>
                  <time dateTime={entry.createdAt.toISOString()}>
                    {entry.createdAt.toISOString().slice(0, 16).replace("T", " ")}
                  </time>
                  {" — "}
                  {entry.oldValue ?? "—"} → {entry.newValue ?? "—"}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-2">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-medium">Pipeline</h3>
              <Link
                href={`/candidates/bulk?requisitionId=${data.id}`}
                className="text-xs underline"
              >
                Bulk status
              </Link>
            </div>
            <PipelineBoard applications={applications} />
          </div>
      </Card>
    </div>
  );
}
