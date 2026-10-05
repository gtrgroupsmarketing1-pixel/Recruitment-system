import { requireSession } from "@/core/auth/session";
import { withTenant } from "@/core/db/client";
import { RequisitionDetail } from "@/modules/requisition/components/RequisitionDetail";
import { listRequisitionAudit } from "@/modules/requisition/requisition.audit";
import { RequisitionService } from "@/modules/requisition/requisition.service";

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
  const data = await withTenant(tenantId, () =>
    RequisitionService.getById(tenantId, id)
  );
  const recentAudit = await withTenant(tenantId, () =>
    listRequisitionAudit(tenantId, id)
  );
  return (
    <main className="p-8">
      <RequisitionDetail data={data} recentAudit={recentAudit} />
    </main>
  );
}
