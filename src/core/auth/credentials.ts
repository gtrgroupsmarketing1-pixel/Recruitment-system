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
  const email = emailRaw.toLowerCase().trim();
  let tid = (tenantId ?? "").trim() || null;

  if (!email || !password) return null;

  // Preview hosts often have no x-tenant-id — resolve demo tenant by slug.
  if (!tid) {
    const slug = process.env.DEV_TENANT_SLUG || "demo";
    try {
      const t = await authPrisma.tenant.findFirst({
        where: { slug, deletedAt: null },
        select: { id: true },
      });
      tid = t?.id ?? null;
    } catch (err) {
      console.error("[AUTH] tenant slug lookup failed", String(err));
    }
  }

  if (!tid) {
    console.error("[AUTH] no tenantId for login", { email });
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
    if (!limit.allowed) {
      logger.warn({ email, identifier }, "auth login rate limited");
      return null;
    }
  } catch (err) {
    // Fail open — missing RateLimit table must not block all logins.
    console.error("[AUTH] rate limit error (continuing)", String(err));
  }

  try {
    const user = await authPrisma.user.findFirst({
      where: { email, tenantId: tid, deletedAt: null },
    });
    if (!user?.passwordHash) {
      console.error("[AUTH] user not found or no password", { email, tid });
      return null;
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      console.error("[AUTH] password mismatch", { email, tid });
      return null;
    }

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
