-- Session 25 client portal. db push materializes columns; this file is the RLS contract applied in CI.
ALTER TABLE "JobOrder" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "JobOrder";
CREATE POLICY tenant_isolation ON "JobOrder"
  USING ("tenantId" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.tenant_id', true));

ALTER TABLE "ClientCandidateComment" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "ClientCandidateComment";
CREATE POLICY tenant_isolation ON "ClientCandidateComment"
  USING ("tenantId" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.tenant_id', true));
