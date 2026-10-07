-- Session 20: document expiry dedup + platform job run log.
-- JobRunLog is not tenant-scoped and has no RLS.

ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "notifiedExpiryAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "JobRunLog" (
  "id" TEXT NOT NULL,
  "jobName" TEXT NOT NULL,
  "startedAt" TIMESTAMP(3) NOT NULL,
  "finishedAt" TIMESTAMP(3) NOT NULL,
  "status" TEXT NOT NULL,
  "itemsProcessed" INTEGER NOT NULL,
  "itemsFailed" INTEGER NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "JobRunLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "JobRunLog_jobName_startedAt_idx" ON "JobRunLog"("jobName", "startedAt");
