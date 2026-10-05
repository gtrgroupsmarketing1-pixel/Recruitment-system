CREATE TABLE IF NOT EXISTS "DomainEvent" (
  id TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  type TEXT NOT NULL,
  payload JSONB NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "dispatchedAt" TIMESTAMPTZ
);
ALTER TABLE "DomainEvent" ADD COLUMN IF NOT EXISTS "dispatchedAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "DomainEvent_tenantId_idx" ON "DomainEvent"("tenantId");
CREATE INDEX IF NOT EXISTS "DomainEvent_tenantId_type_idx" ON "DomainEvent"("tenantId", type);
CREATE INDEX IF NOT EXISTS "DomainEvent_tenantId_createdAt_idx" ON "DomainEvent"("tenantId", "createdAt");
CREATE INDEX IF NOT EXISTS "DomainEvent_tenantId_dispatchedAt_idx" ON "DomainEvent"("tenantId", "dispatchedAt");
ALTER TABLE "DomainEvent" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "DomainEvent";
CREATE POLICY tenant_isolation ON "DomainEvent"
  USING ("tenantId" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.tenant_id', true));
GRANT ALL ON TABLE "DomainEvent" TO app_auth;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "DomainEvent" TO app_tenant;
