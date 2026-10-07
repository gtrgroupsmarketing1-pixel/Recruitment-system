import { NextResponse } from "next/server";
import { runJob } from "@/core/jobs/run-job";
import { runDocumentExpiryJob } from "@/core/jobs/jobs/document-expiry.job";
import { runTaskOverdueJob } from "@/core/jobs/jobs/task-overdue.job";
import { runDocumentGcJob } from "@/core/jobs/jobs/document-gc.job";
import { runDocumentSyncJob } from "@/core/jobs/jobs/document-sync.job";
import { runConnectorPollJob } from "@/core/jobs/jobs/connector-poll.job";

const JOBS: Record<string, () => Promise<unknown>> = {
  "document-expiry": runDocumentExpiryJob,
  "task-overdue": () =>
    runJob("task-overdue", async () => {
      const result = await runTaskOverdueJob();
      return { processed: result.processed, failed: 0 };
    }),
  "document-gc": runDocumentGcJob,
  "document-sync": runDocumentSyncJob,
  "connector-poll": runConnectorPollJob,
};

export function authorizeCron(authorization: string | null): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }
  return authorization === `Bearer ${secret}`;
}

export async function GET(
  req: Request,
  context: { params: Promise<{ job: string }> }
) {
  if (!authorizeCron(req.headers.get("authorization"))) {
    return new Response("Unauthorized", { status: 401 });
  }
  const { job } = await context.params;
  const fn = JOBS[job];
  if (!fn) return new Response("Unknown job", { status: 404 });
  try {
    const result = await fn();
    return NextResponse.json({ ok: true, job, result });
  } catch (err) {
    return NextResponse.json(
      { ok: false, job, error: err instanceof Error ? err.message : "job_failed" },
      { status: 500 }
    );
  }
}

export const POST = GET;
