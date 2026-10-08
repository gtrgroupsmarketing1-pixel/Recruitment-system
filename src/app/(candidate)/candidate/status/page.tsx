import { requireCandidateSession } from "@/core/candidate-auth/session";
import { CandidateStatusService } from "@/modules/candidate-portal/status.service";

export default async function CandidateStatusPage() {
  const session = await requireCandidateSession();
  const apps = await CandidateStatusService.getApplications(session);
  const timelines = await Promise.all(apps.map((app) => CandidateStatusService.getTimeline(session, app.applicationId)));
  return (
    <main className="mx-auto grid max-w-3xl gap-4 p-6">
      {apps.map((app, index) => (
        <section key={app.applicationId}>
          <h1 className="font-semibold">{app.roleCategory}</h1>
          <ul>{timelines[index].map((entry) => <li key={entry.at.toISOString()}>{entry.label}</li>)}</ul>
        </section>
      ))}
    </main>
  );
}
