import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { withTenant } from "@/core/db/client";
import { RequisitionService } from "@/modules/requisition/requisition.service";

export default async function AppHome() {
  const session = await requireSession();
  const tenantId = session.user.tenantId || session.tenantId;
  if (!tenantId) {
    return <main className="p-8">Missing tenant</main>;
  }
  const open = await withTenant(tenantId, () =>
    RequisitionService.list(tenantId, { status: "OPEN" })
  );
  const vacancy = open.reduce((sum, row) => sum + row.vacancyTarget, 0);
  const mobilized = open.reduce((sum, row) => sum + row.fulfillment.mobilized, 0);
  const red = open.filter((row) => row.slaFlag === "RED").slice(0, 3);
  return (
    <main className="grid gap-4 p-8">
      <p>
        Hello, {session.user?.name} @ {tenantId}
      </p>
      <section className="grid gap-2 rounded border p-4">
        <h2 className="font-medium">Open requisitions</h2>
        <p>Count: {open.length}</p>
        <p>Vacancy target: {vacancy}</p>
        <p>Mobilized: {mobilized}</p>
        <h3 className="mt-2 text-sm font-medium">Top RED SLA</h3>
        <ul className="text-sm">
          {red.length === 0 ? (
            <li>None</li>
          ) : (
            red.map((row) => (
              <li key={row.id}>
                <Link href={`/requisitions/${row.id}`} className="font-mono">
                  {row.reqCode}
                </Link>
              </li>
            ))
          )}
        </ul>
        <Link href="/requisitions?status=OPEN" className="text-sm underline">
          All open
        </Link>
      </section>
    </main>
  );
}
