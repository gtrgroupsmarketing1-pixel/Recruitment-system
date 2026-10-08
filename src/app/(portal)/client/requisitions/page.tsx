import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { withSessionScope } from "@/core/auth/action-scope";
import { ClientPortalService } from "@/modules/client/client.portal.service";

export default async function ClientRequisitionsPage() {
  const session = await requireSession();
  const tenantId = session.user.tenantId || session.tenantId!;
  const rows = await withSessionScope(() => ClientPortalService.listRequisitions(tenantId));
  return (
    <main className="grid gap-3">
      <h1 className="text-xl font-semibold">Requisitions</h1>
      <ul className="grid gap-2">
        {rows.map((r) => (
          <li key={r.id}>
            <Link href={`/client/requisitions/${r.id}`} className="underline">
              {r.reqCode} · {r.roleCategory} · {r.country} · {r.status}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
