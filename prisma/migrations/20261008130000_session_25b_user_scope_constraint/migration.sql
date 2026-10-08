-- Session 25b: CLIENT_USER is company-scoped; staff cannot carry clientCompanyId.
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "user_scope_exclusive";
ALTER TABLE "User" ADD CONSTRAINT "user_scope_exclusive" CHECK (
  (role = 'CLIENT_USER' AND "clientCompanyId" IS NOT NULL AND "branchId" IS NULL)
  OR
  (role <> 'CLIENT_USER' AND "clientCompanyId" IS NULL)
);
