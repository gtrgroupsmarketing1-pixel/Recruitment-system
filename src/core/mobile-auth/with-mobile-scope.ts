import type { UserRole } from "@prisma/client";
import { withUserScope } from "@/core/db/client";
import type { SessionScope } from "@/core/auth/scope";
import {
  bearerFromRequest,
  verifyMobileToken,
  type MobileTokenPayload,
} from "@/core/mobile-auth/jwt";

export async function requireMobileUser(
  req: Request
): Promise<MobileTokenPayload> {
  const token = bearerFromRequest(req);
  if (!token) throw new MobileAuthError("Missing bearer token", 401);
  const payload = await verifyMobileToken(token);
  if (!payload) throw new MobileAuthError("Invalid or expired token", 401);
  return payload;
}

export class MobileAuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function withMobileScope<T>(
  req: Request,
  fn: (scope: SessionScope, user: MobileTokenPayload) => Promise<T>
): Promise<T> {
  const user = await requireMobileUser(req);
  const scope: SessionScope = {
    kind: "USER",
    tenantId: user.tenantId,
    userId: user.sub,
    role: user.role as UserRole,
    branchId: user.branchId ?? null,
    clientCompanyId: user.clientCompanyId ?? null,
  };
  return withUserScope(scope, () => fn(scope, user));
}
