-- Session 14: checklistId links on existing detail tables.
-- Applied in CI via prisma db push. RLS already exists from Session 05.
ALTER TABLE "MedicalClearance" ADD COLUMN IF NOT EXISTS "checklistId" TEXT;
ALTER TABLE "AttestationChain" ADD COLUMN IF NOT EXISTS "checklistId" TEXT;
ALTER TABLE "LaborExitClearance" ADD COLUMN IF NOT EXISTS "checklistId" TEXT;
ALTER TABLE "WorkPermitVisa" ADD COLUMN IF NOT EXISTS "checklistId" TEXT;
ALTER TABLE "TravelRecord" ADD COLUMN IF NOT EXISTS "checklistId" TEXT;
ALTER TABLE "DeploymentRecord" ADD COLUMN IF NOT EXISTS "checklistId" TEXT;
