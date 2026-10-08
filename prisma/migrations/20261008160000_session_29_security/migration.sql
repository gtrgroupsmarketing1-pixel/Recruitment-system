-- Session 29: RateLimit is created by prisma db push from schema.
-- Audit integrity: append-only AuditLog for app_tenant.
CREATE OR REPLACE RULE audit_log_no_update AS
  ON UPDATE TO "AuditLog" DO INSTEAD NOTHING;

CREATE OR REPLACE RULE audit_log_no_delete AS
  ON DELETE TO "AuditLog" DO INSTEAD NOTHING;

REVOKE UPDATE, DELETE ON TABLE "AuditLog" FROM app_tenant;
GRANT INSERT, SELECT ON TABLE "AuditLog" TO app_tenant;
