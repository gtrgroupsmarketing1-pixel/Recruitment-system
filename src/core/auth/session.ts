import type { UserRole } from "@prisma/client";
import { auth } from "@/core/auth/auth.config";
import { can, type PermissionKey } from "@/core/auth/permissions";
import { getScope, tryGetScope } from "@/core/auth/scope";
import { ForbiddenError, UnauthorizedError } from "@/lib/errors";

export async function getSession() {
  return auth();
}

export async function requireSession() {
  const session = await getSession();
  if (!session?.user || !session.tenantId) {
    throw new UnauthorizedError();
  }
  return session;
}

/**
 * Throws ForbiddenError if the current scope role lacks the permission.
 * Must be called inside withUserScope / withSessionScope (or protectedProcedure).
 * SYSTEM scope always passes (jobs/webhooks).
 */
export function requirePermission(key: PermissionKey): void {
  const scope = tryGetScope();
  if (!scope) {
    // No scope yet — fail closed in non-production; still require a session path.
    throw new ForbiddenError(`Missing scope for permission ${key}`);
  }
  if (scope.kind === "SYSTEM") return;
  if (!can(scope.role, key)) {
    throw new ForbiddenError(`Role ${scope.role} cannot ${key}`);
  }
}

/** @deprecated Prefer requirePermission. Kept for one-release compatibility. */
export async function requireRole(role: string) {
  const session = await requireSession();
  const current = (session.user?.role ?? session.role) as UserRole | undefined;
  if (current !== role && current !== "TENANT_ADMIN") {
    throw new ForbiddenError(`Requires role ${role}`);
  }
  return session;
}

export type { PermissionKey };
export { can } from "@/core/auth/permissions";
