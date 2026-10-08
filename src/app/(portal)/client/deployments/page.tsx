import { requireSession } from "@/core/auth/session";
import { withSessionScope } from "@/core/auth/action-scope";
import { ClientPortalService } from "@/modules/client/client.portal.service";

export default async function DeploymentsPage() {
  const session = await requireSession();
  const tenantId = session.user.tenantId || session.tenantId!;
  const rows = await withSessionScope(() => ClientPortalService.listDeployments(tenantId));
  return (
    <main>
      <h1 className="text-xl font-semibold">Deployments</h1>
      <ul>{rows.map((r) => <li key={r.applicationId}>{r.displayName} · {r.reqCode} · {r.currentStatus}</li>)}</ul>
    </main>
  );
}
