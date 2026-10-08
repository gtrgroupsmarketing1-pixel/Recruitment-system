import { requireCandidateSession, clearCandidateSessionCookie } from "@/core/candidate-auth/session";
import { CandidateProfileService } from "@/modules/candidate-portal/profile.service";
import { redirect } from "next/navigation";

async function logout() {
  "use server";
  await clearCandidateSessionCookie();
  redirect("/candidate/login");
}

export default async function CandidateSettingsPage() {
  const session = await requireCandidateSession();
  const profile = await CandidateProfileService.getSelf(session);
  return (
    <main className="mx-auto grid max-w-md gap-3 p-6">
      <h1 className="text-xl font-semibold">Settings</h1>
      <p>WhatsApp updates: {profile.whatsappOptIn ? "on" : "off"}</p>
      <p>SMS updates: {profile.smsOptIn ? "on" : "off"}. Standard rates may apply.</p>
      <form action={logout}><button className="underline">Log out</button></form>
    </main>
  );
}
