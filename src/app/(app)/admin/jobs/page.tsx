import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { authPrisma } from "@/core/db/client";
import { PageHeader } from "@/components/ui/page-header";

/**
 * Background job runs (cron / workers) — NOT hiring "jobs".
 * Shows platform JobRunLog entries for ops visibility.
 */
export default async function JobsAdminPage() {
  await requireSession();
  const runs = await authPrisma.jobRunLog.findMany({
    orderBy: { startedAt: "desc" },
    take: 200,
  });

  return (
    <main className="mx-auto grid max-w-5xl gap-4 p-4 sm:p-8">
      <PageHeader
        title="Background job runs"
        description="Cron and worker executions (overdue tasks, document expiry, notifications). This is not the hiring jobs board — use Requisitions and Job orders for that."
        actions={
          <Link href="/admin/notifications" className="text-sm underline underline-offset-2">
            Notifications
          </Link>
        }
      />
      <table className="w-full border-collapse text-start text-sm">
        <thead>
          <tr className="border-b">
            <th className="py-2 pe-2">Job</th>
            <th className="py-2 pe-2">Started</th>
            <th className="py-2 pe-2">Duration</th>
            <th className="py-2 pe-2">Status</th>
            <th className="py-2 pe-2">Processed</th>
            <th className="py-2 pe-2">Failed</th>
          </tr>
        </thead>
        <tbody>
          {runs.length === 0 ? (
            <tr>
              <td colSpan={6} className="py-6 text-center text-muted-foreground">
                No background runs logged yet. Runs appear after cron is enabled in production.
              </td>
            </tr>
          ) : (
            runs.map((run) => {
              const started = run.startedAt ? new Date(run.startedAt) : null;
              const finished = run.finishedAt ? new Date(run.finishedAt) : null;
              const durationMs =
                started && finished ? finished.getTime() - started.getTime() : null;
              return (
                <tr key={run.id} className="border-b">
                  <td className="py-2 pe-2 font-mono text-xs">{run.jobName}</td>
                  <td className="py-2 pe-2">
                    {started ? started.toISOString().slice(0, 19) : "—"}
                  </td>
                  <td className="py-2 pe-2">
                    {durationMs != null ? `${durationMs}ms` : "—"}
                  </td>
                  <td className="py-2 pe-2">{run.status}</td>
                  <td className="py-2 pe-2">{run.itemsProcessed ?? "—"}</td>
                  <td className="py-2 pe-2">{run.itemsFailed ?? "—"}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </main>
  );
}
