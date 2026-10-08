ALTER TABLE "CandidateAuthToken" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "CandidateAuthToken";
CREATE POLICY tenant_isolation ON "CandidateAuthToken"
  USING ("tenantId" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.tenant_id', true));

ALTER TABLE "CandidateAuthRateLimit" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "CandidateAuthRateLimit";
CREATE POLICY tenant_isolation ON "CandidateAuthRateLimit"
  USING ("tenantId" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.tenant_id', true));
