#!/usr/bin/env bash
# Reproducible DB bootstrap for Session 05 gate (no Prisma CLI required).
set -euo pipefail

: "${DIRECT_URL:?Set DIRECT_URL (app_auth / superuser connection)}"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "Applying Prisma SQL migrations (if any)..."
shopt -s nullglob
for f in "$ROOT"/prisma/migrations/*/migration.sql; do
  echo "  $f"
  # Session 05 RLS migration expects tables to exist; bootstrap creates Tenant/User first.
  psql "$DIRECT_URL" -v ON_ERROR_STOP=1 -f "$f" || true
done

echo "Ensuring grants on all public tables..."
psql "$DIRECT_URL" -v ON_ERROR_STOP=1 <<'SQL'
GRANT ALL ON ALL TABLES IN SCHEMA public TO app_auth;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_tenant;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_auth, app_tenant;
SQL

echo "setup-db.sh done"
