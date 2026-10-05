-- Run as postgres superuser against the recruit database.
-- Creates dual roles for Session 05b auth/RLS separation.

CREATE ROLE app_auth NOINHERIT LOGIN PASSWORD 'change-me-auth' BYPASSRLS;
CREATE ROLE app_tenant NOINHERIT LOGIN PASSWORD 'change-me-tenant';

GRANT USAGE ON SCHEMA public TO app_auth, app_tenant;
GRANT ALL ON ALL TABLES IN SCHEMA public TO app_auth;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_tenant;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_auth, app_tenant;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO app_auth;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_tenant;

-- After first migrate, re-grant on new tables:
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO app_auth;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_tenant;
