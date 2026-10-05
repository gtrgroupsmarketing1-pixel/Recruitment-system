import { redirect } from "next/navigation";
import { requireSession } from "@/core/auth/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireSession();
  } catch {
    redirect("/login");
  }
  return <div>{children}</div>;
}
