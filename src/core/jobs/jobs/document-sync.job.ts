import { authPrisma, withTenant, db } from "@/core/db/client";
import { DocumentSyncService } from "@/modules/document/document.sync.service";
import { nextAttemptAt } from "@/core/drive/folder-path";
import { runJob, type JobResult } from "@/core/jobs/run-job";

export async function runDocumentSyncJob(): Promise<JobResult> {
  return runJob("document-sync", async () => {
    const now = new Date();
    const pending = await authPrisma.documentSyncState.findMany({
      where: {
        status: { in: ["PENDING", "FAILED"] },
        attempts: { lt: 5 },
        OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }],
      },
      take: 100,
      orderBy: { lastAttemptAt: "asc" },
    });
    let processed = 0;
    let failed = 0;
    for (const state of pending) {
      try {
        await withTenant(state.tenantId, async () => {
          await db.documentSyncState.updateMany({
            where: { id: state.id, tenantId: state.tenantId },
            data: {
              status: "SYNCING",
              lastAttemptAt: new Date(),
              attempts: { increment: 1 },
            },
          });
          await DocumentSyncService.syncDocument(state.tenantId, state.documentId, state.provider);
        });
        processed += 1;
      } catch (err) {
        failed += 1;
        const when = nextAttemptAt(state.attempts + 1);
        await authPrisma.documentSyncState.update({
          where: { id: state.id },
          data: {
            status: "FAILED",
            // Increment lives in the tenant tx and rolls back with the failed sync.
            attempts: state.attempts + 1,
            lastError: err instanceof Error ? err.message : "sync_failed",
            nextAttemptAt: when,
          },
        });
      }
    }
    return { processed, failed };
  });
}
