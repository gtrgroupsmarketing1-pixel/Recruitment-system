-- Session 15: drop derivable applicationId on detail rows; checklist dueDate.
ALTER TABLE "MedicalClearance" DROP COLUMN IF EXISTS "applicationId";
ALTER TABLE "AttestationChain" DROP COLUMN IF EXISTS "applicationId";
ALTER TABLE "LaborExitClearance" DROP COLUMN IF EXISTS "applicationId";
ALTER TABLE "WorkPermitVisa" DROP COLUMN IF EXISTS "applicationId";
ALTER TABLE "TravelRecord" DROP COLUMN IF EXISTS "applicationId";
ALTER TABLE "DeploymentRecord" DROP COLUMN IF EXISTS "applicationId";
ALTER TABLE "ChecklistInstance" ADD COLUMN IF NOT EXISTS "dueDate" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "ChecklistInstance_tenantId_status_dueDate_idx"
  ON "ChecklistInstance"("tenantId", "status", "dueDate");
