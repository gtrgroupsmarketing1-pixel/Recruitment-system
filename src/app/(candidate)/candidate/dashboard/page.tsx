import { requireCandidateSession } from "@/core/candidate-auth/session";
import { CandidateStatusService } from "@/modules/candidate-portal/status.service";
import { CandidateAppointmentService } from "@/modules/candidate-portal/appointment.service";

export default async function CandidateDashboardPage() {
  const session = await requireCandidateSession();
  const apps = await CandidateStatusService.getApplications(session);
  const next = apps.find((app) => app.nextAction) ?? apps[0];
  const appointments = await CandidateAppointmentService.listUpcoming(session);
  return (
    <main className="mx-auto grid max-w-3xl gap-4 p-6">
      <section className="rounded border bg-white p-4">
        <h1 className="text-lg font-semibold">Your next action</h1>
        <p>{next?.nextAction ?? "Nothing waiting"}</p>
      </section>
      <section className="grid gap-2">
        {apps.map((app) => (
          <article key={app.applicationId} className="rounded border bg-white p-3">
            {app.roleCategory} · {app.currentStatusLabel}
          </article>
        ))}
      </section>
      <section>
        <h2 className="font-semibold">Upcoming appointments</h2>
        <ul>{appointments.map((event) => <li key={event.id}>{event.startsAt.toISOString()}</li>)}</ul>
      </section>
    </main>
  );
}
