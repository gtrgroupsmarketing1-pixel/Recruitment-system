import bcrypt from "bcryptjs";
import { authPrisma } from "@/core/db/client";
import { RATE_LIMITS, checkRateLimit } from "@/core/security/rate-limit";
import { logger } from "@/lib/logger";

export async function authorizeCredentials(
  emailRaw: string,
  password: string,
  tenantId?: string | null,
  ipAddress?: string | null
) {
  const email = emailRaw.toLowerCase();
  if (!email || !password) return null;
  if (!tenantId) return null;

  const identifier = `${ipAddress ?? "unknown"}:${email}`;
  const limit = await checkRateLimit(
    {
      key: "auth:login",
      max: RATE_LIMITS["auth:login"].max,
      windowSeconds: RATE_LIMITS["auth:login"].windowSeconds,
    },
    identifier
  );
  if (!limit.allowed) {
    logger.warn({ email, identifier }, "auth login rate limited");
    return null;
  }

  const user = await authPrisma.user.findFirst({
    where: { email, tenantId, deletedAt: null },
  });
  if (!user?.passwordHash) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    tenantId: user.tenantId,
    role: user.role,
    branchId: user.branchId ?? null,
    clientCompanyId: user.clientCompanyId ?? null,
  };
}
