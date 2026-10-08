import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { withSessionScope } from "@/core/auth/action-scope";
import { JobOrderService } from "@/modules/client/joborder.service";

export default async function JobOrdersPage() {
  const session = await requireSession();
  const tenantId = session.user.tenantId || session.tenantId!;
  const rows = await withSessionScope(() => JobOrderService.listForClient(tenantId));
  return (
    <main className="grid gap-3">
      <div className="flex justify-between">
        <h1 className="text-xl font-semibold">Job orders</h1>
        <Link href="/client/job-orders/new" className="underline">New</Link>
      </div>
      <ul>{rows.map((r) => <li key={r.id}><Link className="underline" href={`/client/job-orders/${r.id}`}>{r.roleTitle} · {r.status}</Link></li>)}</ul>
    </main>
  );
}
