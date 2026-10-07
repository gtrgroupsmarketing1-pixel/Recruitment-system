-- Session 22: Government portal connectors

CREATE TYPE "ConnectorKind" AS ENUM ('WAFID', 'MOHRE', 'DMW', 'MEA', 'EMBASSY');

CREATE TABLE "TenantConnectorConfig" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "connectorId" "ConnectorKind" NOT NULL,
  "isEnabled" BOOLEAN NOT NULL DEFAULT false,
  "credentialsCt" TEXT,
  "pollingIntervalMinutes" INTEGER NOT NULL DEFAULT 60,
  "interRequestDelayMs" INTEGER NOT NULL DEFAULT 3000,
  "lastPolledAt" TIMESTAMP(3),
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "TenantConnectorConfig_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ConnectorCheck" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "connectorId" "ConnectorKind" NOT NULL,
  "checklistId" TEXT NOT NULL,
  "trackingId" TEXT NOT NULL,
  "lastStatus" TEXT NOT NULL DEFAULT 'PENDING',
  "lastRawStatus" TEXT,
  "lastDetails" JSONB,
  "lastCheckedAt" TIMESTAMP(3),
  "lastChangedAt" TIMESTAMP(3),
  "checkCount" INTEGER NOT NULL DEFAULT 0,
  "consecutiveErrors" INTEGER NOT NULL DEFAULT 0,
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ConnectorCheck_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ConnectorCheckLog" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "connectorCheckId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "rawStatus" TEXT,
  "rawPayload" JSONB,
  "errorMessage" TEXT,
  "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ConnectorCheckLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TenantConnectorConfig_tenantId_connectorId_key" ON "TenantConnectorConfig"("tenantId", "connectorId");
CREATE INDEX "TenantConnectorConfig_tenantId_idx" ON "TenantConnectorConfig"("tenantId");
CREATE INDEX "TenantConnectorConfig_isEnabled_lastPolledAt_idx" ON "TenantConnectorConfig"("isEnabled", "lastPolledAt");

CREATE UNIQUE INDEX "ConnectorCheck_checklistId_connectorId_key" ON "ConnectorCheck"("checklistId", "connectorId");
CREATE INDEX "ConnectorCheck_tenantId_connectorId_lastCheckedAt_idx" ON "ConnectorCheck"("tenantId", "connectorId", "lastCheckedAt");
CREATE INDEX "ConnectorCheck_lastStatus_lastCheckedAt_idx" ON "ConnectorCheck"("lastStatus", "lastCheckedAt");

CREATE INDEX "ConnectorCheckLog_tenantId_connectorCheckId_checkedAt_idx" ON "ConnectorCheckLog"("tenantId", "connectorCheckId", "checkedAt");

ALTER TABLE "TenantConnectorConfig" ADD CONSTRAINT "TenantConnectorConfig_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ConnectorCheck" ADD CONSTRAINT "ConnectorCheck_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ConnectorCheck" ADD CONSTRAINT "ConnectorCheck_checklistId_fkey" FOREIGN KEY ("checklistId") REFERENCES "ChecklistInstance"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ConnectorCheckLog" ADD CONSTRAINT "ConnectorCheckLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "TenantConnectorConfig" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "TenantConnectorConfig";
CREATE POLICY tenant_isolation ON "TenantConnectorConfig"
  USING ("tenantId" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.tenant_id', true));

ALTER TABLE "ConnectorCheck" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "ConnectorCheck";
CREATE POLICY tenant_isolation ON "ConnectorCheck"
  USING ("tenantId" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.tenant_id', true));

ALTER TABLE "ConnectorCheckLog" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "ConnectorCheckLog";
CREATE POLICY tenant_isolation ON "ConnectorCheckLog"
  USING ("tenantId" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.tenant_id', true));
