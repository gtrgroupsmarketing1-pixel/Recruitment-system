import { redirect } from "next/navigation";
import { requireSession } from "@/core/auth/session";
import { withTenant } from "@/core/db/client";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let session;
  try {
    session = await requireSession();
  } catch {
    redirect("/login");
  }
  if (!session.tenantId) {
    redirect("/login");
  }
  // Tenant-scoped entry for the app shell. Child server components that
  // query db must also wrap in withTenant (or receive data from here).
  return withTenant(session.tenantId, async () => <div>{children}</div>);
}
