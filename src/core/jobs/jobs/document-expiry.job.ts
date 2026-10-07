import { authPrisma, withTenant } from "@/core/db/client";
import { eventBus } from "@/core/events/event-bus";
import { daysRemaining } from "@/modules/document/document.expiry";
import { runJob, type JobResult } from "@/core/jobs/run-job";

const WEEK_MS = 7 * 86_400_000;

/**
 * Weekly expiry notices. Publishes document.expiring; does not send.
 * Skips documents notified in the last 7 days.
 */
export async function runDocumentExpiryJob(): Promise<JobResult> {
  return runJob("document-expiry", async () => {
    const until = new Date(Date.now() + 30 * 86_400_000);
    const weekAgo = new Date(Date.now() - WEEK_MS);
    const rows = await authPrisma.document.findMany({
      where: {
        deletedAt: null,
        confirmed: true,
        expiryDate: { lte: until, gte: new Date() },
        OR: [{ notifiedExpiryAt: null }, { notifiedExpiryAt: { lt: weekAgo } }],
      },
      take: 500,
    });

    let processed = 0;
    let failed = 0;
    for (const row of rows) {
      if (!row.expiryDate) continue;
      try {
        await withTenant(row.tenantId, async () => {
          await eventBus.publish({
            type: "document.expiring",
            tenantId: row.tenantId,
            payload: {
              documentId: row.id,
              candidateId: row.candidateId,
              type: row.type,
              expiresOn: row.expiryDate!.toISOString(),
              daysRemaining: daysRemaining(row.expiryDate!, Date.now()),
            },
          });
          await authPrisma.document.update({
            where: { id: row.id },
            data: { notifiedExpiryAt: new Date() },
          });
        });
        processed += 1;
      } catch {
        failed += 1;
      }
    }
    return { processed, failed, metadata: { windowDays: 30 } };
  });
}
