-- Session 31: Dual-path screening.
-- Adds outcome/score/completion fields to ScreeningRecord and the ScreeningStep table.

ALTER TYPE "ScreeningPath" RENAME VALUE 'BLUE' TO 'BLUE_COLLAR';
ALTER TYPE "ScreeningPath" RENAME VALUE 'WHITE' TO 'WHITE_COLLAR';

ALTER TABLE "ScreeningRecord"
  ADD COLUMN "outcome" text NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "overallScore" integer,
  ADD COLUMN "completedAt" timestamp(3),
  ADD COLUMN "completedBy" text;

CREATE TABLE "ScreeningStep" (
  "id" text NOT NULL,
  "tenantId" text NOT NULL,
  "screeningId" text NOT NULL,
  "stepOrder" integer NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "status" text NOT NULL DEFAULT 'PENDING',
  "score" integer,
  "notes" text,
  "completedAt" timestamp(3),
  "completedBy" text,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL,
  "deletedAt" timestamp(3),

  CONSTRAINT "ScreeningStep_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ScreeningStep_screeningId_fkey" FOREIGN KEY ("screeningId") REFERENCES "ScreeningRecord"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "ScreeningStep_screeningId_stepOrder_key" ON "ScreeningStep"("screeningId", "stepOrder");
CREATE INDEX "ScreeningStep_tenantId_screeningId_idx" ON "ScreeningStep"("tenantId", "screeningId");
CREATE INDEX "ScreeningStep_tenantId_status_idx" ON "ScreeningStep"("tenantId", "status");

ALTER TABLE "ScreeningStep" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation ON "ScreeningStep";
CREATE POLICY tenant_isolation ON "ScreeningStep"
  USING ("tenantId" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.tenant_id', true));
