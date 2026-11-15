import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { withSessionScope } from "@/core/auth/action-scope";
import { DocumentService } from "@/modules/document/document.service";
import { DocumentList } from "@/modules/document/components/DocumentList";
import { UploadDocumentForm } from "@/modules/document/components/UploadDocumentForm";
import { PageHeader } from "@/components/ui/page-header";
import { db } from "@/core/db/client";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";

type Props = { params: Promise<{ id: string }> };

export default async function CandidateDocumentsPage({ params }: Props) {
  const { id } = await params;
  const session = await requireSession();
  const tenantId = session.user.tenantId || session.tenantId;
  if (!tenantId) throw new Error("Missing tenant");

  const { documents, candidate } = await withSessionScope(async (scope) => {
    const candidate = await db.candidate.findFirst({
      where: { id, tenantId: scope.tenantId, deletedAt: null },
      select: { id: true, fullName: true },
    });
    const documents = await DocumentService.listForCandidate(scope.tenantId, id);
    return { documents, candidate };
  });

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <PageHeader
        title="Candidate documents"
        description={candidate?.fullName ?? id}
        actions={
          <Link
            href={`/candidates/${id}`}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Back to profile
          </Link>
        }
      />
      <UploadDocumentForm
        candidateId={id}
        candidateName={candidate?.fullName}
      />
      <section>
        <h2 className="mb-2 text-sm font-semibold">Vault</h2>
        <DocumentList documents={documents} candidateId={id} staff />
      </section>
    </main>
  );
}
