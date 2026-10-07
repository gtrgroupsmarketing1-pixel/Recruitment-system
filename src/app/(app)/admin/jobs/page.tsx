import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { authPrisma } from "@/core/db/client";

export default async function JobsAdminPage() {
  await requireSession();
  const runs = await authPrisma.jobRunLog.findMany({
    orderBy: { startedAt: "desc" },
    take: 200,
  });

  return (
    <main className="mx-auto grid max-w-5xl gap-4 p-4 sm:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Job runs</h1>
        <Link href="/admin/notifications" className="text-sm underline">
          Notifications
        </Link>
      </div>
      <p className="text-sm text-gray-600">
        Platform-level log. Not tenant-scoped.
      </p>
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b">
            <th className="py-2 pr-2">Job</th>
            <th className="py-2 pr-2">Started</th>
            <th className="py-2 pr-2">Duration</th>
            <th className="py-2 pr-2">Status</th>
            <th className="py-2 pr-2">Processed</th>
            <th className="py-2 pr-2">Failed</th>
          </tr>
        </thead>
        <tbody>
          {runs.length === 0 ? (
            <tr>
              <td colSpan={6} className="py-6 text-center text-gray-500">
                No runs yet
              </td>
            </tr>
          ) : (
            runs.map((r) => (
              <tr key={r.id} className="border-b align-top">
                <td className="py-2 pr-2">{r.jobName}</td>
                <td className="py-2 pr-2 whitespace-nowrap">
                  {r.startedAt.toISOString().slice(0, 19)}Z
                </td>
                <td className="py-2 pr-2">
                  {r.finishedAt.getTime() - r.startedAt.getTime()}ms
                </td>
                <td className="py-2 pr-2">{r.status}</td>
                <td className="py-2 pr-2">{r.itemsProcessed}</td>
                <td className="py-2 pr-2">
                  {r.itemsFailed}
                  {r.metadata ? (
                    <details>
                      <summary className="cursor-pointer text-xs underline">meta</summary>
                      <pre className="mt-1 max-w-xs whitespace-pre-wrap text-xs">
                        {JSON.stringify(r.metadata)}
                      </pre>
                    </details>
                  ) : null}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </main>
  );
}
