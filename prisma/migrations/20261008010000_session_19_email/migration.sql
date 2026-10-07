-- Session 19: tenant email sender config + notification delivery metadata.
-- Applied in CI via prisma db push. RLS added in verify.yml.

ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "htmlBody" TEXT;
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "bounceType" TEXT;
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "bounceReason" TEXT;
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "openedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "Notification_providerId_idx" ON "Notification"("providerId");

CREATE TABLE IF NOT EXISTS "TenantEmailConfig" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "fromName" TEXT NOT NULL,
  "fromEmail" TEXT NOT NULL,
  "replyToEmail" TEXT,
  "signatureHtml" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TenantEmailConfig_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "TenantEmailConfig_tenantId_key" ON "TenantEmailConfig"("tenantId");

DO $$ BEGIN
  ALTER TABLE "TenantEmailConfig" ADD CONSTRAINT "TenantEmailConfig_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
