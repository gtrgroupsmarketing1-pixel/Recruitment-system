import { authPrisma } from "@/core/db/client";
import { getStorage } from "@/core/storage/storage.client";
import { logger } from "@/lib/logger";
import { runJob, type JobResult } from "@/core/jobs/run-job";

const GC_AGE_MS = 72 * 60 * 60 * 1000;

export async function sweepUnconfirmedDocuments(
  now = Date.now()
): Promise<JobResult> {
  const cutoff = new Date(now - GC_AGE_MS);
  const stale = await authPrisma.document.findMany({
    where: { confirmed: false, deletedAt: null, createdAt: { lt: cutoff } },
    select: { id: true, storageKey: true, sizeBytes: true },
    take: 500,
  });

  let processed = 0;
  let failed = 0;
  let bytesReclaimed = 0;

  for (const doc of stale) {
    try {
      const exists = await getStorage().headObject(doc.storageKey);
      if (exists) {
        await getStorage().deleteObject(doc.storageKey);
        bytesReclaimed += doc.sizeBytes;
      }
      await authPrisma.document.update({
        where: { id: doc.id },
        data: { deletedAt: new Date(), confirmed: false },
      });
      processed += 1;
    } catch (err) {
      failed += 1;
      logger.error(
        { documentId: doc.id, err: err instanceof Error ? err.message : "gc_failed" },
        "gc: failed to delete"
      );
    }
  }
  return { processed, failed, metadata: { bytesReclaimed } };
}

export async function runDocumentGcJob(): Promise<JobResult> {
  return runJob("document-gc", () => sweepUnconfirmedDocuments());
}
