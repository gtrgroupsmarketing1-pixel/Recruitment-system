-- Session 18: Notification delivery log + task.overdue dedup column.
-- Applied in CI via prisma db push. RLS added in verify.yml.

-- AlterTable
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "notifiedOverdueAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Task_tenantId_status_notifiedOverdueAt_idx"
  ON "Task"("tenantId", status, "notifiedOverdueAt");

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'WHATSAPP', 'SMS', 'IN_APP');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "NotificationStatus" AS ENUM ('QUEUED', 'SENT', 'DELIVERED', 'FAILED', 'BOUNCED', 'SKIPPED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "Notification" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "channel" "NotificationChannel" NOT NULL,
  "status" "NotificationStatus" NOT NULL DEFAULT 'QUEUED',
  "templateKey" TEXT NOT NULL,
  "recipientType" TEXT NOT NULL,
  "recipientId" TEXT,
  "recipientAddr" TEXT NOT NULL,
  "subject" TEXT,
  "body" TEXT NOT NULL,
  "providerId" TEXT,
  "errorMessage" TEXT,
  "sentAt" TIMESTAMP(3),
  "deliveredAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Notification_tenantId_createdAt_idx" ON "Notification"("tenantId", "createdAt");
CREATE INDEX IF NOT EXISTS "Notification_tenantId_recipientId_idx" ON "Notification"("tenantId", "recipientId");
CREATE INDEX IF NOT EXISTS "Notification_tenantId_templateKey_idx" ON "Notification"("tenantId", "templateKey");
CREATE INDEX IF NOT EXISTS "Notification_tenantId_status_idx" ON "Notification"("tenantId", status);

DO $$ BEGIN
  ALTER TABLE "Notification" ADD CONSTRAINT "Notification_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
