import { requireCandidateSession } from "@/core/candidate-auth/session";
import { CandidateAppointmentService } from "@/modules/candidate-portal/appointment.service";

export default async function CandidateAppointmentsPage() {
  const session = await requireCandidateSession();
  const rows = await CandidateAppointmentService.listUpcoming(session);
  return (
    <main className="mx-auto grid max-w-3xl gap-3 p-6">
      <h1 className="text-xl font-semibold">Appointments</h1>
      <ul>{rows.map((row) => <li key={row.id}>{row.title} · {row.startsAt.toISOString()}</li>)}</ul>
    </main>
  );
}
