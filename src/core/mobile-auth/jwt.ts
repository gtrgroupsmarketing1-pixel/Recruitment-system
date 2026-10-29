import { SignJWT, jwtVerify } from "jose";
import type { UserRole } from "@prisma/client";

export type MobileTokenPayload = {
  sub: string;
  tenantId: string;
  role: UserRole;
  branchId?: string | null;
  clientCompanyId?: string | null;
  email?: string;
  name?: string;
};

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not configured");
  return new TextEncoder().encode(secret);
}

export async function signMobileToken(
  payload: MobileTokenPayload,
  maxAgeSeconds = 30 * 24 * 60 * 60
): Promise<string> {
  return new SignJWT({
    tenantId: payload.tenantId,
    role: payload.role,
    branchId: payload.branchId ?? null,
    clientCompanyId: payload.clientCompanyId ?? null,
    email: payload.email,
    name: payload.name,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${maxAgeSeconds}s`)
    .sign(secretKey());
}

export async function verifyMobileToken(
  token: string
): Promise<MobileTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    const sub = typeof payload.sub === "string" ? payload.sub : null;
    const tenantId =
      typeof payload.tenantId === "string" ? payload.tenantId : null;
    const role = typeof payload.role === "string" ? (payload.role as UserRole) : null;
    if (!sub || !tenantId || !role) return null;
    return {
      sub,
      tenantId,
      role,
      branchId:
        typeof payload.branchId === "string" ? payload.branchId : null,
      clientCompanyId:
        typeof payload.clientCompanyId === "string"
          ? payload.clientCompanyId
          : null,
      email: typeof payload.email === "string" ? payload.email : undefined,
      name: typeof payload.name === "string" ? payload.name : undefined,
    };
  } catch {
    return null;
  }
}

export function bearerFromRequest(req: Request): string | null {
  const h = req.headers.get("authorization") ?? req.headers.get("Authorization");
  if (!h?.startsWith("Bearer ")) return null;
  return h.slice(7).trim() || null;
}
