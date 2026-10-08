import type { UserRole } from "@prisma/client";
import { requireSession } from "@/core/auth/session";
import { withUserScope } from "@/core/db/client";
import type { SessionScope } from "@/core/auth/scope";

/**
 * Wraps a server action body in withUserScope derived from the current session.
 */
export async function withSessionScope<T>(
  fn: (scope: SessionScope) => Promise<T>
): Promise<T> {
  const session = await requireSession();
  const tenantId = session.user.tenantId || session.tenantId;
  if (!tenantId || !session.user.id) {
    throw new Error("Missing session tenant or user");
  }
  const role = (session.user.role ?? session.role) as UserRole;
  const branchId = session.user.branchId ?? session.branchId ?? null;
  const scope: SessionScope = {
    kind: "USER",
    tenantId,
    userId: session.user.id,
    role,
    branchId,
  };
  return withUserScope(scope, () => fn(scope));
}
