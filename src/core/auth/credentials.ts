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
  console.log("[AUTH] enter", { emailRaw, tenantId, ipAddress });

  const email = emailRaw.toLowerCase().trim();
  const tid = (tenantId ?? "").trim() || null;

  if (!email || !password) {
    console.log("[AUTH] missing email or password");
    return null;
  }
  if (!tid) {
    console.log("[AUTH] missing tenantId");
    return null;
  }

  const identifier = `${ipAddress ?? "unknown"}:${email}`;
  try {
    const limit = await checkRateLimit(
      {
        key: "auth:login",
        max: RATE_LIMITS["auth:login"].max,
        windowSeconds: RATE_LIMITS["auth:login"].windowSeconds,
      },
      identifier
    );
    console.log("[AUTH] rate limit", limit);
    if (!limit.allowed) {
      logger.warn({ email, identifier }, "auth login rate limited");
      return null;
    }
  } catch (err) {
    console.error("[AUTH] rate limit error", String(err));
    return null;
  }

  try {
    const user = await authPrisma.user.findFirst({
      where: { email, tenantId: tid, deletedAt: null },
    });
    console.log(
      "[AUTH] user",
      user?.id ?? "NONE",
      "hashLen",
      user?.passwordHash?.length ?? 0
    );
    if (!user?.passwordHash) return null;

    const ok = await bcrypt.compare(password, user.passwordHash);
    console.log("[AUTH] bcrypt", ok);
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
  } catch (err) {
    console.error("[AUTH] db error", String(err));
    return null;
  }
}