-- Session 21: per-tenant Drive/OneDrive connection and push-only sync state.

CREATE TYPE "ExternalProvider" AS ENUM ('GOOGLE_DRIVE', 'ONEDRIVE');
CREATE TYPE "SyncStatus" AS ENUM ('PENDING', 'SYNCING', 'SYNCED', 'FAILED', 'SKIPPED', 'DELETED');

CREATE TABLE "TenantStorageConnection" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "provider" "ExternalProvider" NOT NULL,
  "externalAccountId" TEXT NOT NULL,
  "externalEmail" TEXT NOT NULL,
  "accessToken" TEXT NOT NULL,
  "refreshToken" TEXT NOT NULL,
  "tokenExpiresAt" TIMESTAMP(3) NOT NULL,
  "rootFolderId" TEXT NOT NULL,
  "rootFolderName" TEXT NOT NULL,
  "scopes" TEXT NOT NULL,
  "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "connectedBy" TEXT NOT NULL,
  "lastSyncAt" TIMESTAMP(3),
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "TenantStorageConnection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DocumentSyncState" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "documentId" TEXT NOT NULL,
  "provider" "ExternalProvider" NOT NULL,
  "status" "SyncStatus" NOT NULL DEFAULT 'PENDING',
  "externalFileId" TEXT,
  "externalUrl" TEXT,
  "lastAttemptAt" TIMESTAMP(3),
  "nextAttemptAt" TIMESTAMP(3),
  "lastError" TEXT,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DocumentSyncState_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TenantStorageConnection_tenantId_provider_key" ON "TenantStorageConnection"("tenantId", "provider");
CREATE INDEX "TenantStorageConnection_tenantId_idx" ON "TenantStorageConnection"("tenantId");
CREATE UNIQUE INDEX "DocumentSyncState_documentId_provider_key" ON "DocumentSyncState"("documentId", "provider");
CREATE INDEX "DocumentSyncState_tenantId_status_idx" ON "DocumentSyncState"("tenantId", "status");
CREATE INDEX "DocumentSyncState_status_attempts_idx" ON "DocumentSyncState"("status", "attempts");

ALTER TABLE "TenantStorageConnection" ADD CONSTRAINT "TenantStorageConnection_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DocumentSyncState" ADD CONSTRAINT "DocumentSyncState_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DocumentSyncState" ADD CONSTRAINT "DocumentSyncState_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TenantStorageConnection" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "TenantStorageConnection";
CREATE POLICY tenant_isolation ON "TenantStorageConnection"
  USING ("tenantId" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.tenant_id', true));

ALTER TABLE "DocumentSyncState" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "DocumentSyncState";
CREATE POLICY tenant_isolation ON "DocumentSyncState"
  USING ("tenantId" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.tenant_id', true));
