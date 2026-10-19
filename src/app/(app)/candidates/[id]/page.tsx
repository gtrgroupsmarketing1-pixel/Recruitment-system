import { requireSession } from "@/core/auth/session";
import { withSessionScope } from "@/core/auth/action-scope";
import { CandidateService } from "@/modules/candidate/candidate.service";
import { db } from "@/core/db/client";
import { CandidateDetail } from "@/modules/candidate/components/CandidateDetail";
import { notFound } from "next/navigation";

export default async function CandidateDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requireSession();
  const { id } = await params;
  const { error } = await searchParams;

  let candidate = null;
  let requisitions: { id: string; reqCode: string }[] = [];

  try {
    candidate = await withSessionScope(async (scope) => {
      return CandidateService.getById(scope.tenantId, id);
    });
    
    requisitions = await withSessionScope(async (scope) => {
      return db.jobRequisition.findMany({
        where: { tenantId: scope.tenantId, status: "OPEN", deletedAt: null },
        select: { id: true, reqCode: true },
      });
    });
  } catch (err) {
    console.error("CANDIDATE_PAGE_ERROR:", err);
  }

  if (!candidate) {
    notFound();
  }

  return (
    <div className="p-6">
      {error && (
        <div className="mb-4 rounded border border-red-500 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <CandidateDetail data={candidate} requisitions={requisitions} />
    </div>
  );
}