-- Session 08: typed ReqStatus + recruiter/notes indexes.
-- Apply via psql when available. Tables may not exist yet in this sandbox.

DO $$ BEGIN
  CREATE TYPE "ReqStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'FILLED', 'CANCELLED', 'ON_HOLD');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Convert only if JobRequisition exists and status is still text.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'JobRequisition' AND column_name = 'status' AND udt_name <> 'ReqStatus'
  ) THEN
    ALTER TABLE "JobRequisition"
      ALTER COLUMN "status" TYPE "ReqStatus"
      USING "status"::"ReqStatus";
    ALTER TABLE "JobRequisition"
      ALTER COLUMN "status" SET DEFAULT 'OPEN';
  END IF;
END $$;

ALTER TABLE "JobRequisition" ADD COLUMN IF NOT EXISTS "assignedRecruiterId" TEXT;
ALTER TABLE "JobRequisition" ADD COLUMN IF NOT EXISTS "notes" TEXT;

CREATE INDEX IF NOT EXISTS "JobRequisition_tenantId_clientCompanyId_idx"
  ON "JobRequisition"("tenantId", "clientCompanyId");
CREATE INDEX IF NOT EXISTS "JobRequisition_tenantId_targetOnboardingDate_idx"
  ON "JobRequisition"("tenantId", "targetOnboardingDate");
