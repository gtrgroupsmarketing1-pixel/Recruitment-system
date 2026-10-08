CREATE UNIQUE INDEX IF NOT EXISTS "Tenant_customDomain_key"
  ON "Tenant"("customDomain") WHERE "customDomain" IS NOT NULL;
