import { withUserScope } from "@/core/db/client";
import type { SessionScope } from "@/core/auth/scope";
import type { MobileTokenPayload } from "./jwt";
import { bearerFromRequest, verifyMobileToken } from "./jwt";

export async function requireMobileScope(
  req: Request
): Promise<SessionScope> {
  const token = bearerFromRequest(req);
  if (!token) throw new MobileAuthError("Missing Bearer token", 401);
  const payload = await verifyMobileToken(token);
  if (!payload) throw new MobileAuthError("Invalid or expired token", 401);
  return {
    kind: "USER",
    tenantId: payload.tenantId,
    userId: payload.sub,
    role: payload.role,
    branchId: payload.branchId ?? null,
    clientCompanyId: payload.clientCompanyId ?? null,
  };
}

export async function withMobileScope<T>(
  req: Request,
  fn: (scope: SessionScope) => Promise<T>
): Promise<T> {
  const scope = await requireMobileScope(req);
  return withUserScope(scope, () => fn(scope));
}

export class MobileAuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}
