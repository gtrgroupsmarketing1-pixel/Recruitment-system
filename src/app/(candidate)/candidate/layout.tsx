import Link from "next/link";
import { requireCandidateSession } from "@/core/candidate-auth/session";

export default async function CandidateLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="flex gap-4 border-b bg-white px-4 py-3 text-sm">
        <Link href="/candidate/dashboard">Home</Link>
        <Link href="/candidate/status">Status</Link>
        <Link href="/candidate/documents">Documents</Link>
        <Link href="/candidate/appointments">Appointments</Link>
        <Link href="/candidate/settings">Settings</Link>
      </header>
      {children}
    </div>
  );
}

export async function candidateGuard() {
  return requireCandidateSession();
}
