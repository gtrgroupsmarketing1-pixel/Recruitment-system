import { Card } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import type { RequisitionView } from "@/modules/requisition/requisition.service";
import {
  ApplicationList,
  type ApplicationListItem,
} from "@/modules/application/components/ApplicationList";
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
  return (
    <div className="grid gap-4">
      <Tabs
        active="overview"
        tabs={[
          { id: "overview", label: "Overview" },
          { id: "pipeline", label: "Pipeline" },
          { id: "compliance", label: "Compliance" },
          { id: "tasks", label: "Tasks" },
        ]}
      >
        <Card>
          <div className="flex items-center gap-2">
            <span className="font-mono text-lg">{data.reqCode}</span>
            <ReqStatusBadge status={data.status} />
            <SlaBadge flag={data.slaFlag} />
          </div>
          <p className="mt-2 text-sm">
            {data.client.name} ({data.client.code}) · {data.country} ·{" "}
            {data.roleCategory}
          </p>
          <p className="mt-2 text-sm">Target onboarding: {onboard}</p>
          <p className="mt-1 text-sm">
            Recruiter: {data.assignedRecruiterId ?? "Unassigned"}
          </p>
          <div className="mt-3">
            <FulfillmentBar
              mobilized={data.fulfillment.mobilized}
              target={data.fulfillment.target}
            />
          </div>
          <p className="mt-3 text-sm">{data.notes ?? "No notes."}</p>
          <h3 className="mt-4 text-sm font-medium">Recent activity</h3>
          {recentAudit.length === 0 ? (
            <p className="text-sm text-neutral-500">No status changes yet.</p>
          ) : (
            <ul className="mt-2 space-y-1 text-sm">
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
          <div className="mt-6">
            <h3 className="text-sm font-medium">Pipeline</h3>
            <ApplicationList data={applications} />
          </div>
        </Card>
      </Tabs>
    </div>
  );
}
