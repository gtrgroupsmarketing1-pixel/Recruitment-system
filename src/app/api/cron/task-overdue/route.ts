import { NextResponse } from "next/server";
import { runTaskOverdueJob } from "@/core/jobs/jobs/task-overdue.job";
import { logger } from "@/lib/logger";

/**
 * Vercel Cron (or any scheduler) hits this endpoint hourly.
 * Auth: CRON_SECRET bearer header. Without CRON_SECRET set, reject in production.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "cron_secret_required" }, { status: 503 });
  }

  try {
    const result = await runTaskOverdueJob();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    logger.error(
      { err: err instanceof Error ? err.message : "job_failed" },
      "task-overdue cron failed"
    );
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
