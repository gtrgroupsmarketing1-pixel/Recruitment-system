#!/usr/bin/env bash
set -euo pipefail
: "${AUTH_DATABASE_URL:?required}"
: "${DATABASE_URL:?required}"

STAMP=$(date +%s)
T_ID="t-outbox-$STAMP"

psql "$AUTH_DATABASE_URL" -v ON_ERROR_STOP=1 -c \
  "INSERT INTO \"Tenant\" (id, name, slug, \"createdAt\", \"updatedAt\")
   VALUES ('$T_ID', 'Outbox Test', 'outbox-$STAMP', now(), now());"

# Prove: DomainEvent insert rolls back with its enclosing tx
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 <<SQL
BEGIN;
SELECT set_config('app.tenant_id', '$T_ID', true);
INSERT INTO "DomainEvent" (id, "tenantId", type, payload, "createdAt")
VALUES ('evt-rollback-$STAMP', '$T_ID', 'candidate.status_changed', '{}'::jsonb, now());
ROLLBACK;
SQL

COUNT=$(psql "$AUTH_DATABASE_URL" -tAc \
  "SELECT count(*) FROM \"DomainEvent\" WHERE id = 'evt-rollback-$STAMP';")
COUNT=$(echo "$COUNT" | tr -d '[:space:]')
if [ "$COUNT" != "0" ]; then
  echo "FAIL: rollback left $COUNT DomainEvent rows"
  exit 1
fi

# Prove: committed insert persists
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 <<SQL
BEGIN;
SELECT set_config('app.tenant_id', '$T_ID', true);
INSERT INTO "DomainEvent" (id, "tenantId", type, payload, "createdAt")
VALUES ('evt-commit-$STAMP', '$T_ID', 'candidate.status_changed', '{}'::jsonb, now());
COMMIT;
SQL

COUNT=$(psql "$AUTH_DATABASE_URL" -tAc \
  "SELECT count(*) FROM \"DomainEvent\" WHERE id = 'evt-commit-$STAMP';")
COUNT=$(echo "$COUNT" | tr -d '[:space:]')
if [ "$COUNT" != "1" ]; then
  echo "FAIL: committed insert not found (count=$COUNT)"
  exit 1
fi

psql "$AUTH_DATABASE_URL" -c "DELETE FROM \"DomainEvent\" WHERE \"tenantId\" = '$T_ID'; DELETE FROM \"Tenant\" WHERE id = '$T_ID';"
echo "OUTBOX ROLLBACK SEMANTICS PASSED"
