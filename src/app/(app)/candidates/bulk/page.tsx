import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { withSessionScope } from "@/core/auth/action-scope";
import { EmptyState } from "@/components/ui/empty-state";
import { ApplicationService } from "@/modules/application/application.service";
import { ApplicationStatusSchema } from "@/modules/application/application.schema";
import { CandidateRepo } from "@/modules/candidate/candidate.repo";
import {
  BulkGrid,
  type BulkRow,
} from "@/modules/candidate/components/BulkGrid";

type Props = {
  searchParams: Promise<{ requisitionId?: string }>;
};

export default async function BulkPage({ searchParams }: Props) {
  const sp = await searchParams;
  const requisitionId = sp.requisitionId;
  const session = await requireSession();
  const tenantId = session.user.tenantId || session.tenantId;
  if (!tenantId) {
    return <main className="p-8">Missing tenant</main>;
  }
  if (!requisitionId) {
    return (
      <main className="p-8">
        <EmptyState message="Select a requisition first. Open a requisition and use Bulk, or pass ?requisitionId=..." />
      </main>
    );
  }

  const rows: BulkRow[] = await withSessionScope(async (_scope) => {
    const apps = await ApplicationService.listByRequisition(
      tenantId,
      requisitionId
    );
    const out: BulkRow[] = [];
    for (const app of apps.slice(0, 200)) {
      const candidate = await CandidateRepo.findById(tenantId, app.candidateId);
      const parsed = ApplicationStatusSchema.safeParse(app.status);
      out.push({
        id: app.candidateId,
        applicationId: app.id,
        fullName: candidate?.fullName ?? app.candidateId,
        phone: candidate?.phone ?? null,
        status: parsed.success ? parsed.data : String(app.status),
      });
    }
    return out;
  });

  return (
    <main className="grid gap-4 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Bulk status</h1>
        <Link
          href={`/requisitions/${requisitionId}`}
          className="text-sm underline"
        >
          Back to requisition
        </Link>
      </div>
      <BulkGrid requisitionId={requisitionId} rows={rows} />
    </main>
  );
}
