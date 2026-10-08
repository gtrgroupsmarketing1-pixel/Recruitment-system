import { authPrisma } from "@/core/db/client";

const WINDOW_MS = 15 * 60_000;
const MAX_REQUESTS = 3;

export async function assertAuthRateLimit(tenantId: string, candidateId: string): Promise<void> {
  const windowStart = new Date(Math.floor(Date.now() / WINDOW_MS) * WINDOW_MS);
  const existing = await authPrisma.candidateAuthRateLimit.findFirst({
    where: { candidateId, windowStart },
  });
  if (existing && existing.count >= MAX_REQUESTS) {
    const err = new Error("Too many auth requests");
    (err as Error & { status: number }).status = 429;
    throw err;
  }
  if (!existing) {
    await authPrisma.candidateAuthRateLimit.create({
      data: { tenantId, candidateId, windowStart, count: 1 },
    });
    return;
  }
  await authPrisma.candidateAuthRateLimit.updateMany({
    where: { id: existing.id },
    data: { count: existing.count + 1 },
  });
}

export async function sweepAuthRateLimits(now = Date.now()): Promise<number> {
  const table = authPrisma.candidateAuthRateLimit;
  if (!table) return 0;
  const cutoff = new Date(now - 24 * 60 * 60_000);
  const result = await table.deleteMany({
    where: { windowStart: { lt: cutoff } },
  });
  return result.count;
}
