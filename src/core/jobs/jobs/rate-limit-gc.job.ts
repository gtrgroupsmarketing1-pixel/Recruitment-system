import { authPrisma } from "@/core/db/client";
import { runJob, type JobResult } from "@/core/jobs/run-job";

export async function rateLimitGcJob(): Promise<JobResult> {
  return runJob("rate-limit-gc", async () => {
    const cutoff = new Date(Date.now() - 60 * 60_000);
    const result = await authPrisma.rateLimit.deleteMany({
      where: { windowStart: { lt: cutoff } },
    });
    return { processed: result.count, failed: 0 };
  });
}
