import { redirect } from "next/navigation";
import { requireSession } from "@/core/auth/session";
import { withSessionScope } from "@/core/auth/action-scope";

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
  if (session.user.role === "CLIENT_USER" || session.role === "CLIENT_USER") {
    redirect("/client/dashboard");
  }
  // Tenant + USER scope for the app shell. Child server components that
  // query db open their own withSessionScope (layout tx ends before children render).
  return withSessionScope(async (_scope) => <div>{children}</div>);
}
