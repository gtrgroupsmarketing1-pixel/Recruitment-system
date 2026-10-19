import { requireSession } from "@/core/auth/session";
import { withSessionScope } from "@/core/auth/action-scope";
import { CandidateRepo } from "@/modules/candidate/candidate.repo";
import { notFound } from "next/navigation";
import { CandidateDetail } from "@/modules/candidate/components/CandidateDetail";

export default async function CandidatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  const { id } = await params;

  let candidate = null;
  let errorMsg = null;

  try {
    candidate = await withSessionScope(async () => {
      // Assuming findById includes applications, if not, you might need a service method
      return CandidateRepo.findById(session.user.tenantId, id);
    });
  } catch (err: any) {
    console.error("CANDIDATE_DETAIL_ERROR:", err);
    errorMsg = err.message || "Failed to load candidate";
  }

  if (errorMsg) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-bold text-red-600">Error loading candidate</h1>
        <p className="mt-2 text-sm">{errorMsg}</p>
      </div>
    );
  }

  if (!candidate) notFound();

  return (
    <div className="p-6">
      <CandidateDetail candidate={candidate} />
    </div>
  );
}