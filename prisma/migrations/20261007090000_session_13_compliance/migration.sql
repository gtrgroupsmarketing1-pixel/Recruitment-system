-- Session 13 compliance tables are materialized by schema (db push in CI).
-- RLS policies (tenantId).

ALTER TABLE "ComplianceTemplate" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "ComplianceTemplate";
CREATE POLICY tenant_isolation ON "ComplianceTemplate"
  USING ("tenantId" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.tenant_id', true));

ALTER TABLE "ComplianceStepTemplate" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "ComplianceStepTemplate";
CREATE POLICY tenant_isolation ON "ComplianceStepTemplate"
  USING ("tenantId" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.tenant_id', true));

ALTER TABLE "ComplianceCase" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "ComplianceCase";
CREATE POLICY tenant_isolation ON "ComplianceCase"
  USING ("tenantId" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.tenant_id', true));

ALTER TABLE "ChecklistInstance" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "ChecklistInstance";
CREATE POLICY tenant_isolation ON "ChecklistInstance"
  USING ("tenantId" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.tenant_id', true));
