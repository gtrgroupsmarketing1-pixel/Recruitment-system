import { requireSession } from "@/core/auth/session";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/shell/Sidebar";
import { TopBar } from "@/components/shell/TopBar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();
  if (session.user.role === "CLIENT_USER") {
    redirect("/client/dashboard");
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar role={session.user.role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar userName={session.user.name ?? "User"} role={session.user.role} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}