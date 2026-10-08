import { requireSession } from "@/core/auth/session";
import { withSessionScope } from "@/core/auth/action-scope";
import { db } from "@/core/db/client";
import { NotFoundError } from "@/lib/errors";

export default async function JobOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession();
  const tenantId = session.user.tenantId || session.tenantId!;
  const row = await withSessionScope(async (scope) => {
    const found = await db.jobOrder.findFirst({
      where: { id, tenantId, clientCompanyId: scope.clientCompanyId ?? "__never__", deletedAt: null },
    });
    if (!found) throw new NotFoundError("JobOrder", id);
    return found;
  });
  return (
    <main>
      <h1 className="text-xl font-semibold">{row.roleTitle}</h1>
      <p>Status: {row.status}</p>
      {row.reviewNotes ? <p>Notes: {row.reviewNotes}</p> : null}
    </main>
  );
}
