import { requireSession } from "@/core/auth/session";
import { withTenant } from "@/core/db/client";
import { CandidateDetail } from "@/modules/candidate/components/CandidateDetail";
import { CandidateService } from "@/modules/candidate/candidate.service";

type DetailProps = {
  params: Promise<{ id: string }>;
};

export default async function CandidateDetailPage({ params }: DetailProps) {
  const { id } = await params;
  const session = await requireSession();
  const tenantId = session.user.tenantId || session.tenantId;
  if (!tenantId) return <main className="p-8">Missing tenant</main>;
  const data = await withTenant(tenantId, () =>
    CandidateService.getById(tenantId, id)
  );
  return (
    <main className="p-8">
      <CandidateDetail data={data} />
    </main>
  );
}
