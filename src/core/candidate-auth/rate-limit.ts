import { RATE_LIMITS, checkRateLimit } from "@/core/security/rate-limit";
import { authPrisma } from "@/core/db/client";

export async function assertAuthRateLimit(tenantId: string, candidateId: string): Promise<void> {
  void tenantId;
  const spec = RATE_LIMITS["candidate-auth:request"];
  const result = await checkRateLimit(
    {
      key: "candidate-auth:request",
      max: spec.max,
      windowSeconds: spec.windowSeconds,
    },
    candidateId
  );
  if (!result.allowed) {
    const err = new Error("Too many auth requests");
    (err as Error & { status: number }).status = 429;
    throw err;
  }
}

export async function sweepAuthRateLimits(now = Date.now()): Promise<number> {
  const table = authPrisma.candidateAuthRateLimit;
  if (!table) return 0;
  const cutoff = new Date(now - 24 * 60 * 60_000);
  const result = await table.deleteMany({
    where: { windowStart: { lt: cutoff } },
  });
  // Also sweep platform RateLimit rows older than 1h
  try {
    const rl = await authPrisma.rateLimit.deleteMany({
      where: { windowStart: { lt: new Date(now - 60 * 60_000) } },
    });
    return result.count + rl.count;
  } catch {
    return result.count;
  }
}
