import { requireSession } from "@/core/auth/session";
import { withSessionScope } from "@/core/auth/action-scope";
import { DocumentService } from "@/modules/document/document.service";
import { DocumentList } from "@/modules/document/components/DocumentList";

type Props = { params: Promise<{ id: string }> };

export default async function CandidateDocumentsPage({ params }: Props) {
  const { id } = await params;
  const session = await requireSession();
  const tenantId = session.user.tenantId || session.tenantId;
  if (!tenantId) throw new Error("Missing tenant");
  const documents = await withSessionScope((_scope) => DocumentService.listForCandidate(tenantId, id));
  return (
    <main className="mx-auto max-w-3xl p-4">
      <h1 className="text-xl font-semibold">Candidate documents</h1>
      <DocumentList documents={documents} />
    </main>
  );
}
