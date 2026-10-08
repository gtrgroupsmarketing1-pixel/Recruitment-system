import type { UserRole } from "@prisma/client";
import { auth } from "@/core/auth/auth.config";
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

/** @deprecated Prefer requirePermission. Kept for one-release compatibility. */
export async function requireRole(role: string) {
  const session = await requireSession();
  const current = (session.user?.role ?? session.role) as UserRole | undefined;
  if (current !== role && current !== "TENANT_ADMIN") {
    throw new ForbiddenError(`Requires role ${role}`);
  }
  return session;
}

export type { PermissionKey } from "@/core/auth/permissions";
export { can, requirePermission } from "@/core/auth/permissions";
