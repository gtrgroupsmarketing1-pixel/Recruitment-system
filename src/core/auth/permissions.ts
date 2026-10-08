import type { UserRole } from "@prisma/client";
import { tryGetScope } from "@/core/auth/scope";
import { ForbiddenError } from "@/lib/errors";

/**
 * Single source of truth for RBAC. Server requirePermission + UI can() read from this.
 * Keys use "resource:action" form. Matrix frozen in Session 24.
 */
export const PERMISSIONS = {
  // Requisitions
  "requisition:create": ["TENANT_ADMIN", "BRANCH_MANAGER"],
  "requisition:update": ["TENANT_ADMIN", "BRANCH_MANAGER", "RECRUITER"],
  "requisition:view": [
    "TENANT_ADMIN",
    "BRANCH_MANAGER",
    "RECRUITER",
    "MOBILIZATION_OFFICER",
    "COMPLIANCE_OFFICER",
    "FINANCE",
  ],
  "requisition:delete": ["TENANT_ADMIN"],
  "requisition:assign_recruiter": ["TENANT_ADMIN", "BRANCH_MANAGER"],

  // Candidates
  "candidate:create": ["TENANT_ADMIN", "BRANCH_MANAGER", "RECRUITER"],
  "candidate:update": ["TENANT_ADMIN", "BRANCH_MANAGER", "RECRUITER"],
  "candidate:view": [
    "TENANT_ADMIN",
    "BRANCH_MANAGER",
    "RECRUITER",
    "MOBILIZATION_OFFICER",
    "COMPLIANCE_OFFICER",
  ],
  "candidate:delete": ["TENANT_ADMIN"],
  "candidate:view_sensitive": [
    "TENANT_ADMIN",
    "BRANCH_MANAGER",
    "RECRUITER",
    "COMPLIANCE_OFFICER",
  ],

  // Applications
  "application:create": ["TENANT_ADMIN", "BRANCH_MANAGER", "RECRUITER"],
  "application:change_status": [
    "TENANT_ADMIN",
    "BRANCH_MANAGER",
    "RECRUITER",
    "MOBILIZATION_OFFICER",
    "COMPLIANCE_OFFICER",
  ],
  "application:view": [
    "TENANT_ADMIN",
    "BRANCH_MANAGER",
    "RECRUITER",
    "MOBILIZATION_OFFICER",
    "COMPLIANCE_OFFICER",
    "FINANCE",
  ],

  // Compliance
  "compliance:template_manage": ["TENANT_ADMIN", "COMPLIANCE_OFFICER"],
  "compliance:complete_step": [
    "TENANT_ADMIN",
    "BRANCH_MANAGER",
    "COMPLIANCE_OFFICER",
  ],
  "compliance:uncomplete_step": ["TENANT_ADMIN", "COMPLIANCE_OFFICER"],
  "compliance:view_case": [
    "TENANT_ADMIN",
    "BRANCH_MANAGER",
    "RECRUITER",
    "MOBILIZATION_OFFICER",
    "COMPLIANCE_OFFICER",
    "FINANCE",
  ],
  "compliance:view_dashboard": [
    "TENANT_ADMIN",
    "BRANCH_MANAGER",
    "COMPLIANCE_OFFICER",
  ],

  // Documents
  "document:upload": [
    "TENANT_ADMIN",
    "BRANCH_MANAGER",
    "RECRUITER",
    "MOBILIZATION_OFFICER",
    "COMPLIANCE_OFFICER",
  ],
  "document:download": [
    "TENANT_ADMIN",
    "BRANCH_MANAGER",
    "RECRUITER",
    "MOBILIZATION_OFFICER",
    "COMPLIANCE_OFFICER",
  ],
  "document:delete": ["TENANT_ADMIN", "COMPLIANCE_OFFICER"],

  // Tasks
  "task:view_own": [
    "TENANT_ADMIN",
    "BRANCH_MANAGER",
    "RECRUITER",
    "MOBILIZATION_OFFICER",
    "COMPLIANCE_OFFICER",
    "FINANCE",
  ],
  "task:view_all": ["TENANT_ADMIN", "BRANCH_MANAGER", "COMPLIANCE_OFFICER"],
  "task:update": [
    "TENANT_ADMIN",
    "BRANCH_MANAGER",
    "RECRUITER",
    "MOBILIZATION_OFFICER",
    "COMPLIANCE_OFFICER",
    "FINANCE",
  ],

  // Calendar
  "calendar:connect_own": [
    "TENANT_ADMIN",
    "BRANCH_MANAGER",
    "RECRUITER",
    "MOBILIZATION_OFFICER",
    "COMPLIANCE_OFFICER",
    "FINANCE",
  ],
  "calendar:schedule_interview": [
    "TENANT_ADMIN",
    "BRANCH_MANAGER",
    "RECRUITER",
  ],

  // Connectors
  "connector:configure": ["TENANT_ADMIN", "COMPLIANCE_OFFICER"],
  "connector:trigger_check": [
    "TENANT_ADMIN",
    "BRANCH_MANAGER",
    "COMPLIANCE_OFFICER",
  ],

  // Integrations (Drive)
  "integration:connect_drive": ["TENANT_ADMIN"],
  "integration:view_sync": [
    "TENANT_ADMIN",
    "BRANCH_MANAGER",
    "COMPLIANCE_OFFICER",
  ],

  // Admin
  "admin:notifications": ["TENANT_ADMIN"],
  "admin:jobs": ["TENANT_ADMIN"],
  "admin:sms": ["TENANT_ADMIN"],
  "admin:email_config": ["TENANT_ADMIN"],

  // Users
  "user:invite": ["TENANT_ADMIN"],
  "user:update_role": ["TENANT_ADMIN"],
  "user:deactivate": ["TENANT_ADMIN"],

  "joborder:submit": ["CLIENT_USER"],
  "joborder:view": ["TENANT_ADMIN", "BRANCH_MANAGER", "CLIENT_USER"],
  "joborder:review": ["TENANT_ADMIN", "BRANCH_MANAGER"],
  "client:view_requisitions": ["CLIENT_USER"],
  "client:view_candidates": ["CLIENT_USER"],
  "client:comment_candidate": ["CLIENT_USER"],
  "client:view_documents": ["CLIENT_USER"],
  "client:view_deployments": ["CLIENT_USER"],
  "client_user:manage": ["TENANT_ADMIN"],
  "tenant:manage_branding": ["TENANT_ADMIN"],
} as const satisfies Record<string, readonly UserRole[]>;

export type PermissionKey = keyof typeof PERMISSIONS;

export function can(role: UserRole, key: PermissionKey): boolean {
  const allowed = PERMISSIONS[key] as readonly UserRole[];
  return allowed.includes(role);
}


/**
 * Throws ForbiddenError if the current scope role lacks the permission.
 * Lives here (not session.ts) so tests can import it without loading NextAuth.
 * Must be called inside withUserScope / withSessionScope. SYSTEM scope always passes.
 */
export function requirePermission(key: PermissionKey): void {
  const scope = tryGetScope();
  if (!scope) {
    throw new ForbiddenError(`Missing scope for permission ${key}`);
  }
  if (scope.kind === "SYSTEM") return;
  if (!can(scope.role, key)) {
    throw new ForbiddenError(`Role ${scope.role} cannot ${key}`);
  }
}
