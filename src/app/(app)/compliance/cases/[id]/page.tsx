import { requireSession } from "@/core/auth/session";
import { withTenant } from "@/core/db/client";
import { CompleteStepButton } from "@/modules/compliance/components/CompleteStepButton";
import { DetailsFormForStep } from "@/modules/compliance/components/DetailsFormForStep";
import { ComplianceCaseService } from "@/modules/compliance/compliance.case.service";
import { ChecklistSlaBadge } from "@/modules/compliance/components/ChecklistSlaBadge";
import { listCaseAudit } from "@/modules/compliance/compliance.audit.repo";
import { computeChecklistOverdue } from "@/modules/compliance/compliance.overdue";
import { assessRisk } from "@/modules/compliance/compliance.risk";
import { RiskBadge } from "@/modules/compliance/components/dashboard/RiskBadge";
import { db } from "@/core/db/client";
import { ConnectorCheckService } from "@/modules/connector/connector.check.service";
import { getConnector } from "@/core/connectors/registry";
import { ConnectorStatusPanel } from "@/modules/compliance/components/connector/ConnectorStatusPanel";
import { StartTrackingForm } from "@/modules/compliance/components/connector/StartTrackingForm";
import { startTrackingAction } from "./start-tracking.action";

type Props = { params: Promise<{ id: string }> };

export default async function CasePage({ params }: Props) {
  const { id } = await params;
  const session = await requireSession();
  const tenantId = session.user.tenantId || session.tenantId;
  if (!tenantId) return <main className="p-8">Missing tenant</main>;
  const [case_, audit, checks] = await withTenant(tenantId, async () => {
    const row = await ComplianceCaseService.getCase(tenantId, id);
    const trail = await listCaseAudit(tenantId, id, 20);
    const connectorChecks = await Promise.all(
      row.steps.map(async (step) => {
        if (!step.connectorId) return [step.id, null] as const;
        const check = await ConnectorCheckService.getByChecklist(tenantId, step.id);
        return [step.id, check] as const;
      })
    );
    return [row, trail, new Map(connectorChecks)] as const;
  });
  const requisition = await withTenant(tenantId, () =>
    db.jobRequisition.findFirst({ where: { id: case_.requisitionId, tenantId, deletedAt: null } })
  );
  const risk = assessRisk({
    caseCreatedAt: case_.createdAt,
    targetOnboardingDate: requisition?.targetOnboardingDate ?? null,
    checklists: case_.steps.map((step) => ({
      stepOrder: step.stepOrder,
      name: step.name,
      status: step.status,
      dueDate: step.dueDate,
    })),
  });
  const now = Date.now();
  return (
    <main className="mx-auto max-w-2xl p-4 sm:p-8">
      <h1 className="text-xl font-semibold">Compliance case</h1>
      <p className="text-sm text-neutral-500">{case_.status}</p>
      <ol className="mt-4 grid gap-2">
        {case_.steps.map((step) => (
          <li
            key={step.id}
            className={`flex items-center justify-between rounded border p-3 text-sm ${step.locked ? "opacity-50" : ""}`}
          >
            <div>
              <p>
                {step.status === "COMPLETE" ? "[done]" : step.locked ? "[locked]" : "[ ]"}{" "}
                {step.name}
              </p>
              <ChecklistSlaBadge
                dueDate={step.dueDate}
                completed={step.status === "COMPLETE"}
                isOverdue={computeChecklistOverdue(step.status, step.dueDate, now)}
              />
              {step.locked ? (
                <p className="text-xs">Waiting on: {step.waitingOn}</p>
              ) : null}
              {step.connectorId ? (
                (() => {
                  const check = checks.get(step.id);
                  const connector = getConnector(step.connectorId.toLowerCase());
                  if (!connector) return null;
                  if (check) {
                    return (
                      <ConnectorStatusPanel
                        connectorId={connector.id}
                        connectorName={connector.displayName}
                        checklistId={step.id}
                        check={check}
                      />
                    );
                  }
                  return (
                    <StartTrackingForm checklistId={step.id} action={startTrackingAction} />
                  );
                })()
              ) : null}
            </div>
            <div>
              <CompleteStepButton
                caseId={case_.id}
                checklistId={step.id}
                locked={step.locked || step.status === "COMPLETE"}
                waitingOn={step.waitingOn}
              />
              <DetailsFormForStep
                caseId={case_.id}
                checklistId={step.id}
                connectorId={step.connectorId}
              />
            </div>
          </li>
        ))}
      </ol>
      <section className="mt-6">
        <h2 className="text-sm font-medium">Audit trail</h2>
        <ul className="mt-2 text-xs text-neutral-600">
          {audit.length === 0 ? <li>No audit rows yet.</li> : audit.map((row) => (
            <li key={row.id}>
              {row.createdAt.toISOString().slice(0, 16)} {row.entity} {row.field}: {row.oldValue} → {row.newValue}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
