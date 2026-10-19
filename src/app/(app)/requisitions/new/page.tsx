import { CreateRequisitionForm } from "@/modules/requisition/components/CreateRequisitionForm";
import { requireSession } from "@/core/auth/session";
import { withSessionScope } from "@/core/auth/action-scope";
import { db } from "@/core/db/client";

type NewProps = {
  searchParams: Promise<{ client?: string }>;
};

export default async function NewRequisitionPage({ searchParams }: NewProps) {
  const sp = await searchParams;
  const session = await requireSession();
  const tenantId = session.user.tenantId || session.tenantId;
  if (!tenantId) {
    return <main className="p-8">Missing tenant</main>;
  }
  const clients = await withSessionScope((_scope) =>
    db.clientCompany.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true, code: true },
    })
  );
  return (
    <main className="p-8">
      <h1 className="mb-4 text-xl font-semibold">New requisition</h1>
      <CreateRequisitionForm
        clientCompanyId={sp.client ?? undefined}
        clients={clients}
      />
    </main>
  );
}
