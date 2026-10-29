import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { withSessionScope } from "@/core/auth/action-scope";
import { db } from "@/core/db/client";
import { disconnectDriveAction, retryFailedSyncsAction } from "./actions";

export default async function IntegrationsPage() {
  const session = await requireSession();
  const tenantId = session.user.tenantId || session.tenantId;
  if (!tenantId) return <main className="p-8">Missing tenant</main>;

  const [connections, counts] = await withSessionScope(async (_scope) => {
    const rows = await db.tenantStorageConnection.findMany({
      where: { tenantId, deletedAt: null },
    });
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const failed = await db.documentSyncState.count({
      where: { tenantId, status: "FAILED", updatedAt: { gte: since } },
    });
    const synced = await db.documentSyncState.count({
      where: { tenantId, status: "SYNCED", updatedAt: { gte: since } },
    });
    const pending = await db.documentSyncState.count({
      where: { tenantId, status: { in: ["PENDING", "SYNCING"] }, updatedAt: { gte: since } },
    });
    return [rows, { failed, synced, pending }] as const;
  });

  const google = connections.find((c) => c.provider === "GOOGLE_DRIVE");
  const ms = connections.find((c) => c.provider === "ONEDRIVE");

  return (
    <main className="mx-auto grid max-w-2xl gap-4 p-4 sm:p-8">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Integrations</h1>
        <div className="flex gap-3 text-sm">
          <Link href="/settings/calendar" className="underline">Calendar</Link>
          <Link href="/admin/jobs" className="underline text-muted-foreground">Job runs</Link>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        Cloud storage and calendar. Disconnect stops new syncs and does not delete files in Drive.
      </p>
      <section className="rounded border p-3 text-sm">
        <h2 className="font-medium">Google Drive</h2>
        <p>{google ? google.externalEmail : "Not connected"}</p>
        {google ? (
          <form action={disconnectDriveAction}>
            <input type="hidden" name="provider" value="GOOGLE_DRIVE" />
            <button className="mt-2 rounded border px-3 py-1" type="submit">Disconnect</button>
          </form>
        ) : (
          <a className="mt-2 inline-block underline" href="/api/oauth/google">Connect Google Drive</a>
        )}
      </section>
      <section className="rounded border p-3 text-sm">
        <h2 className="font-medium">OneDrive</h2>
        <p>{ms ? ms.externalEmail : "Not connected"}</p>
        {ms ? (
          <form action={disconnectDriveAction}>
            <input type="hidden" name="provider" value="ONEDRIVE" />
            <button className="mt-2 rounded border px-3 py-1" type="submit">Disconnect</button>
          </form>
        ) : (
          <a className="mt-2 inline-block underline" href="/api/oauth/microsoft">Connect OneDrive</a>
        )}
      </section>
      <section className="text-sm">
        <p>Last 24h: synced {counts.synced} · pending {counts.pending} · failed {counts.failed}</p>
        <form action={retryFailedSyncsAction}>
          <button className="mt-2 rounded bg-black px-3 py-1 text-white" type="submit">
            Retry all failed
          </button>
        </form>
      </section>
    </main>
  );
}
