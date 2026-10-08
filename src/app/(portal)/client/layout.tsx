import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSession } from "@/core/auth/session";

export default async function ClientPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();
  if (session.user.role !== "CLIENT_USER" && session.role !== "CLIENT_USER") {
    redirect("/");
  }
  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="flex items-center justify-between border-b bg-white px-6 py-3">
        <strong>Client portal</strong>
        <nav className="flex gap-4 text-sm">
          <Link href="/client/dashboard">Dashboard</Link>
          <Link href="/client/requisitions">Requisitions</Link>
          <Link href="/client/job-orders">Job orders</Link>
          <Link href="/client/documents">Documents</Link>
          <Link href="/client/deployments">Deployments</Link>
          <Link href="/client/reports">Reports</Link>
        </nav>
      </header>
      <div className="p-6">{children}</div>
    </div>
  );
}
