import { requireSession } from "@/core/auth/session";
import { withTenant } from "@/core/db/client";
import { CompleteStepButton } from "@/modules/compliance/components/CompleteStepButton";
import { DetailsFormForStep } from "@/modules/compliance/components/DetailsFormForStep";
import { ComplianceCaseService } from "@/modules/compliance/compliance.case.service";

type Props = { params: Promise<{ id: string }> };

export default async function CasePage({ params }: Props) {
  const { id } = await params;
  const session = await requireSession();
  const tenantId = session.user.tenantId || session.tenantId;
  if (!tenantId) return <main className="p-8">Missing tenant</main>;
  const case_ = await withTenant(tenantId, () =>
    ComplianceCaseService.getCase(tenantId, id)
  );
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
                {step.status === "COMPLETED" ? "[done]" : step.locked ? "[locked]" : "[ ]"}{" "}
                {step.name}
              </p>
              {step.locked ? (
                <p className="text-xs">Waiting on: {step.waitingOn}</p>
              ) : null}
            </div>
            <div>
              <CompleteStepButton
                caseId={case_.id}
                checklistId={step.id}
                locked={step.locked || step.status === "COMPLETED"}
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
    </main>
  );
}
