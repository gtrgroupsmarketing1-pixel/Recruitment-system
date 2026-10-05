import { db } from "@/core/db/client";
import { requireSession } from "@/core/auth/session";

export default async function AppHome() {
  const session = await requireSession();
  const tenant = await db.tenant.findFirst({
    where: { id: session.tenantId, deletedAt: null },
  });
  return (
    <main className="p-8">
      <p>
        Hello, {session.user?.name} @ {tenant?.name ?? "unknown tenant"}
      </p>
    </main>
  );
}
