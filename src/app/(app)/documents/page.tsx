import { requireSession } from "@/core/auth/session";
import { withSessionScope } from "@/core/auth/action-scope";
import { DocumentService } from "@/modules/document/document.service";
import { DocumentList } from "@/modules/document/components/DocumentList";

export default async function DocumentsPage() {
  const session = await requireSession();
  const tenantId = session.user.tenantId || session.tenantId;
  if (!tenantId) throw new Error("Missing tenant");
  const expiring = await withSessionScope((_scope) => DocumentService.listExpiring(30));
  const mine = expiring.filter((row) => row.tenantId === tenantId);
  return (
    <main className="mx-auto max-w-3xl p-4">
      <h1 className="text-xl font-semibold">Documents expiring in 30 days</h1>
      <DocumentList documents={mine} />
    </main>
  );
}
