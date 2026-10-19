import { requireSession } from "@/core/auth/session";
import { withSessionScope } from "@/core/auth/action-scope";
import { db } from "@/core/db/client";
import { CreateRequisitionForm } from "@/modules/requisition/components/CreateRequisitionForm";

export default async function NewRequisitionPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requireSession();
  const params = await searchParams;

  const clients = await withSessionScope(async () => {
    return db.clientCompany.findMany({
      where: { tenantId: session.user.tenantId, deletedAt: null },
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" },
    });
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">New requisition</h1>
      
      {params.error && (
        <div className="rounded border border-red-500 bg-red-50 p-3 text-sm text-red-700">
          <strong>Error:</strong> {params.error}
        </div>
      )}

      <CreateRequisitionForm clients={clients} />
    </div>
  );
}