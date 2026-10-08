import { requireCandidateSession } from "@/core/candidate-auth/session";
import { CandidateDocumentService } from "@/modules/candidate-portal/document.service";

export default async function CandidateDocumentsPage() {
  const session = await requireCandidateSession();
  const docs = await CandidateDocumentService.list(session);
  return (
    <main className="mx-auto grid max-w-3xl gap-3 p-6">
      <h1 className="text-xl font-semibold">Documents</h1>
      <ul>{docs.map((doc) => <li key={doc.id}>{doc.label} · {doc.fileName}</li>)}</ul>
    </main>
  );
}
