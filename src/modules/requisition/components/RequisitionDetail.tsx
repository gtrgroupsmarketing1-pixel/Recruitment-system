import { Card } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import type { RequisitionView } from "@/modules/requisition/requisition.service";
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
};

export function RequisitionDetail({ data, recentAudit }: Props) {
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
          <h3 className="mt-4 text-sm font-medium">Recent status changes</h3>
          <ul className="mt-2 text-sm">
            {recentAudit.length === 0 ? (
              <li>None yet.</li>
            ) : (
              recentAudit.map((row) => (
                <li key={row.id}>
                  {row.oldValue ?? "—"} → {row.newValue ?? "—"} (
                  {row.createdAt.toISOString().slice(0, 10)})
                </li>
              ))
            )}
          </ul>
          <p className="mt-4 text-xs text-neutral-500">
            Pipeline, compliance, and tasks are empty until later sessions.
          </p>
        </Card>
      </Tabs>
    </div>
  );
}
