import { requireSession } from "@/core/auth/session";
import { withSessionScope } from "@/core/auth/action-scope";
import { ClientPortalService } from "@/modules/client/client.portal.service";
import { JobOrderService } from "@/modules/client/joborder.service";

export default async function ClientDashboard() {
  const session = await requireSession();
  const tenantId = session.user.tenantId || session.tenantId!;
  const [reqs, orders] = await withSessionScope(async () => {
    const r = await ClientPortalService.listRequisitions(tenantId);
    const o = await JobOrderService.listForClient(tenantId);
    return [r, o] as const;
  });
  return (
    <main className="grid gap-4">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <p>{reqs.length} open requisitions · {orders.filter((o) => o.status === "PENDING").length} pending job orders</p>
    </main>
  );
}
