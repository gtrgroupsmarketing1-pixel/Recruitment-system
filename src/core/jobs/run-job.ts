import { authPrisma } from "@/core/db/client";
import { logger } from "@/lib/logger";

export type JobResult = {
  processed: number;
  failed: number;
  metadata?: Record<string, unknown>;
};

export async function runJob(
  name: string,
  fn: () => Promise<JobResult>
): Promise<JobResult> {
  const startedAt = new Date();
  try {
    const result = await fn();
    await authPrisma.jobRunLog.create({
      data: {
        jobName: name,
        startedAt,
        finishedAt: new Date(),
        status: result.failed > 0 ? "PARTIAL" : "OK",
        itemsProcessed: result.processed,
        itemsFailed: result.failed,
        metadata: result.metadata ?? {},
      },
    });
    logger.info(
      { job: name, processed: result.processed, failed: result.failed },
      "job complete"
    );
    return result;
  } catch (err) {
    await authPrisma.jobRunLog.create({
      data: {
        jobName: name,
        startedAt,
        finishedAt: new Date(),
        status: "FAILED",
        itemsProcessed: 0,
        itemsFailed: 0,
        metadata: { error: err instanceof Error ? err.message : "job_failed" },
      },
    });
    logger.error(
      { job: name, err: err instanceof Error ? err.message : "job_failed" },
      "job failed"
    );
    throw err;
  }
}
