-- Session 12: Task table + RLS
-- Note: enums/table may already exist after db push; CI applies RLS via separate step.

CREATE TYPE "TaskType" AS ENUM (
  'FOLLOW_UP_MEDICAL','FOLLOW_UP_ATTESTATION','FOLLOW_UP_VISA','FOLLOW_UP_DOCUMENTS',
  'CLIENT_UPDATE','SCHEDULE_INTERVIEW','COMPLIANCE_INITIATE','TRAVEL_BOOKING',
  'ARRIVAL_CONFIRM','PROBATION_CHECK_IN','EXIT_RECORD','CUSTOM'
);
CREATE TYPE "TaskStatus" AS ENUM ('OPEN','IN_PROGRESS','COMPLETED','OVERDUE','CANCELLED');
CREATE TYPE "TaskPriority" AS ENUM ('LOW','MEDIUM','HIGH','URGENT');

CREATE TABLE "Task" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "assigneeId" TEXT,
  "type" "TaskType" NOT NULL,
  "refType" TEXT NOT NULL,
  "refId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "dueDate" TIMESTAMP(3),
  "status" "TaskStatus" NOT NULL DEFAULT 'OPEN',
  "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
  "notes" TEXT,
  "generatedKey" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Task_tenantId_generatedKey_key" ON "Task"("tenantId", "generatedKey");
CREATE INDEX "Task_tenantId_assigneeId_status_dueDate_idx" ON "Task"("tenantId", "assigneeId", "status", "dueDate");
CREATE INDEX "Task_tenantId_refType_refId_idx" ON "Task"("tenantId", "refType", "refId");
CREATE INDEX "Task_tenantId_status_dueDate_idx" ON "Task"("tenantId", "status", "dueDate");

ALTER TABLE "Task" ADD CONSTRAINT "Task_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Task" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "Task"
  USING ("tenantId" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.tenant_id', true));
