#!/usr/bin/env bash
set -euo pipefail
: "${AUTH_DATABASE_URL:?required}"
: "${DATABASE_URL:?required}"

STAMP=$(date +%s)
A_ID="t-a-$STAMP"
B_ID="t-b-$STAMP"
B_USER="u-b-$STAMP"

echo "--- Setup (app_auth, BYPASSRLS) ---"
psql "$AUTH_DATABASE_URL" -v ON_ERROR_STOP=1 <<SQL
INSERT INTO "Tenant" (id, name, slug, "createdAt", "updatedAt")
VALUES ('$A_ID', 'A', 'a-$STAMP', now(), now()),
       ('$B_ID', 'B', 'b-$STAMP', now(), now());
INSERT INTO "User" (id, "tenantId", email, name, role, "createdAt", "updatedAt")
VALUES ('$B_USER', '$B_ID', 'b-$STAMP@test', 'B User', 'RECRUITER', now(), now());
SQL

echo "--- Verify (app_tenant, RLS enforced) ---"
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 <<SQL
DO \$\$
DECLARE c int;
BEGIN
  SELECT count(*) INTO c FROM "User" WHERE id = '$B_USER';
  IF c <> 0 THEN RAISE EXCEPTION 'FAIL: saw B user without tenant context (% rows)', c; END IF;
  RAISE NOTICE 'PASS: RLS blocks unscoped queries';
END \$\$;

DO \$\$
DECLARE c int;
BEGIN
  PERFORM set_config('app.tenant_id', '$A_ID', true);
  SELECT count(*) INTO c FROM "User" WHERE "tenantId" = '$B_ID';
  IF c <> 0 THEN RAISE EXCEPTION 'FAIL: A saw % of B''s users', c; END IF;
  RAISE NOTICE 'PASS: cross-tenant isolation';
END \$\$;

DO \$\$
DECLARE c int;
BEGIN
  PERFORM set_config('app.tenant_id', '$B_ID', true);
  SELECT count(*) INTO c FROM "User" WHERE "tenantId" = '$B_ID';
  IF c <> 1 THEN RAISE EXCEPTION 'FAIL: B saw % of own users (expected 1)', c; END IF;
  RAISE NOTICE 'PASS: tenant sees own data';
END \$\$;
SQL

psql "$AUTH_DATABASE_URL" -v ON_ERROR_STOP=1 <<SQL
DELETE FROM "User" WHERE id = '$B_USER';
DELETE FROM "Tenant" WHERE id IN ('$A_ID', '$B_ID');
SQL

echo "ALL ISOLATION CHECKS PASSED"
