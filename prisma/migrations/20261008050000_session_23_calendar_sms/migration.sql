-- Session 23: Calendar + SMS

ALTER TABLE "Candidate" ADD COLUMN IF NOT EXISTS "smsOptIn" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Candidate" ADD COLUMN IF NOT EXISTS "smsOptInAt" TIMESTAMP(3);
ALTER TABLE "Candidate" ADD COLUMN IF NOT EXISTS "whatsappOptIn" BOOLEAN NOT NULL DEFAULT true;

CREATE TYPE "CalendarProvider" AS ENUM ('GOOGLE', 'MICROSOFT');
CREATE TYPE "ScheduledEventStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'FAILED');

CREATE TABLE "UserCalendarConnection" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "provider" "CalendarProvider" NOT NULL,
  "externalAccountId" TEXT NOT NULL,
  "externalEmail" TEXT NOT NULL,
  "accessToken" TEXT NOT NULL,
  "refreshToken" TEXT NOT NULL,
  "tokenExpiresAt" TIMESTAMP(3) NOT NULL,
  "scopes" TEXT NOT NULL,
  "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastUsedAt" TIMESTAMP(3),
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "UserCalendarConnection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ScheduledEvent" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "applicationId" TEXT,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3) NOT NULL,
  "timezone" TEXT NOT NULL,
  "organizerUserId" TEXT NOT NULL,
  "provider" "CalendarProvider",
  "externalEventId" TEXT,
  "meetingUrl" TEXT,
  "attendees" JSONB NOT NULL,
  "status" "ScheduledEventStatus" NOT NULL DEFAULT 'PENDING',
  "cancellationReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ScheduledEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TenantSmsQuota" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "day" TEXT NOT NULL,
  "sentCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TenantSmsQuota_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserCalendarConnection_userId_provider_key" ON "UserCalendarConnection"("userId", "provider");
CREATE INDEX "UserCalendarConnection_tenantId_idx" ON "UserCalendarConnection"("tenantId");
CREATE INDEX "ScheduledEvent_tenantId_startsAt_idx" ON "ScheduledEvent"("tenantId", "startsAt");
CREATE INDEX "ScheduledEvent_tenantId_organizerUserId_startsAt_idx" ON "ScheduledEvent"("tenantId", "organizerUserId", "startsAt");
CREATE INDEX "ScheduledEvent_tenantId_applicationId_idx" ON "ScheduledEvent"("tenantId", "applicationId");
CREATE INDEX "ScheduledEvent_tenantId_status_idx" ON "ScheduledEvent"("tenantId", "status");
CREATE UNIQUE INDEX "TenantSmsQuota_tenantId_day_key" ON "TenantSmsQuota"("tenantId", "day");

ALTER TABLE "UserCalendarConnection" ADD CONSTRAINT "UserCalendarConnection_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "UserCalendarConnection" ADD CONSTRAINT "UserCalendarConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ScheduledEvent" ADD CONSTRAINT "ScheduledEvent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ScheduledEvent" ADD CONSTRAINT "ScheduledEvent_organizerUserId_fkey" FOREIGN KEY ("organizerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ScheduledEvent" ADD CONSTRAINT "ScheduledEvent_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "CandidateApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TenantSmsQuota" ADD CONSTRAINT "TenantSmsQuota_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "UserCalendarConnection" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "UserCalendarConnection"
  USING ("tenantId" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.tenant_id', true));

ALTER TABLE "ScheduledEvent" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "ScheduledEvent"
  USING ("tenantId" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.tenant_id', true));

ALTER TABLE "TenantSmsQuota" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "TenantSmsQuota"
  USING ("tenantId" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.tenant_id', true));
