import { requireSession } from "@/core/auth/session";
import { withSessionScope } from "@/core/auth/action-scope";
import { nextStates } from "@/modules/application/application.state-machine";
import { ApplicationService } from "@/modules/application/application.service";
import { CandidateRepo } from "@/modules/candidate/candidate.repo";
import { RequisitionDetail } from "@/modules/requisition/components/RequisitionDetail";
import { listRequisitionAudit } from "@/modules/requisition/requisition.audit";
import { RequisitionService } from "@/modules/requisition/requisition.service";
import { ApplicationStatusSchema } from "@/modules/application/application.schema";

type DetailProps = {
  params: Promise<{ id: string }>;
};

export default async function RequisitionDetailPage({ params }: DetailProps) {
  const { id } = await params;
  const session = await requireSession();
  const tenantId = session.user.tenantId || session.tenantId;
  if (!tenantId) {
    return <main className="p-8">Missing tenant</main>;
  }
  const data = await withSessionScope((_scope) =>
    RequisitionService.getById(tenantId, id)
  );
  const recentAudit = await withSessionScope((_scope) =>
    listRequisitionAudit(tenantId, id)
  );
  const applications = await withSessionScope(async (_scope) => {
    const rows = await ApplicationService.listByRequisition(tenantId, id);
    const items = [];
    for (const row of rows) {
      const candidate = await CandidateRepo.findById(tenantId, row.candidateId);
      const parsedStatus = ApplicationStatusSchema.safeParse(row.status);
      items.push({
        id: row.id,
        candidateId: row.candidateId,
        requisitionId: row.requisitionId,
        status: row.status,
        candidateName: candidate?.fullName ?? row.candidateId,
        allowed: parsedStatus.success ? nextStates(parsedStatus.data) : [],
      });
    }
    return items;
  });
  return (
    <main className="p-8">
      <RequisitionDetail
        data={data}
        recentAudit={recentAudit}
        applications={applications}
      />
    </main>
  );
}
