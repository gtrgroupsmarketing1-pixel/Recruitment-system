import { requireSession } from "@/core/auth/session";
import { withSessionScope } from "@/core/auth/action-scope";
import { requirePermission } from "@/core/auth/session";
import { JobOrderService } from "@/modules/client/joborder.service";
import { reviewJobOrderAction } from "./review.action";

export default async function AdminJobOrdersPage() {
  const session = await requireSession();
  const tenantId = session.user.tenantId || session.tenantId!;
  const rows = await withSessionScope(async () => {
    requirePermission("joborder:review");
    return JobOrderService.listForStaff(tenantId);
  });
  return (
    <main className="grid gap-3 p-6">
      <h1 className="text-xl font-semibold">Job orders</h1>
      <ul className="grid gap-2">
        {rows.map((r) => (
          <li key={r.id} className="rounded border p-3">
            {r.roleTitle} · {r.status}
            {r.status === "PENDING" ? (
              <form action={reviewJobOrderAction} className="mt-2 flex gap-2">
                <input type="hidden" name="id" value={r.id} />
                <input name="notes" placeholder="Notes" className="rounded border px-2" />
                <button name="action" value="ACCEPT">Accept</button>
                <button name="action" value="REJECT">Reject</button>
              </form>
            ) : null}
          </li>
        ))}
      </ul>
    </main>
  );
}
