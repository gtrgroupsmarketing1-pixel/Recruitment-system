import { RealtimeRefresher } from "@/components/realtime/RealtimeRefresher";
import { requireSession } from "@/core/auth/session";
import { withSessionScope } from "@/core/auth/action-scope";
import { nextStates } from "@/modules/application/application.state-machine";
import { ApplicationService } from "@/modules/application/application.service";
import { CandidateRepo } from "@/modules/candidate/candidate.repo";
import { RequisitionDetail } from "@/modules/requisition/components/RequisitionDetail";
import { listRequisitionAudit } from "@/modules/requisition/requisition.audit";
import { RequisitionService } from "@/modules/requisition/requisition.service";
import { ApplicationStatusSchema } from "@/modules/application/application.schema";
import { ScreeningPanel } from "@/modules/screening/components/ScreeningPanel";

type DetailProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function RequisitionDetailPage({ params, searchParams }: DetailProps) {
  const { id } = await params;
  const { error } = await searchParams;
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
    <>
      <RealtimeRefresher eventTypes={["candidate.status_changed"]} />
      <main className="p-8 space-y-6">
        {error && (
          <div className="rounded border border-red-500 bg-red-50 p-3 text-sm text-red-700 max-w-5xl">
            <strong>Cannot update status:</strong> {error}
          </div>
        )}
        
        <RequisitionDetail
          data={data}
          recentAudit={recentAudit}
          applications={applications}
        />
        
        {applications.length > 0 && (
          <div className="mt-8 max-w-7xl space-y-3">
            <div>
              <h2 className="text-lg font-semibold">Candidate screening</h2>
              <p className="text-sm text-muted-foreground">
                Complete every step for a candidate. When all steps pass, outcome becomes
                PASSED and you can shortlist them.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {applications.map((app) => (
                <ScreeningPanel
                  key={app.id}
                  tenantId={tenantId}
                  applicationId={app.id}
                  candidateId={app.candidateId}
                  candidateName={app.candidateName}
                  applicationStatus={app.status}
                />
              ))}
            </div>
          </div>
        )}
      </main>
    </>
  );
}