import { authPrisma } from "@/core/db/client";

export type RateLimitSpec = {
  key: string;
  max: number;
  windowSeconds: number;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
};

export const RATE_LIMITS = {
  "auth:login": { max: 10, windowSeconds: 60 },
  "auth:signup": { max: 5, windowSeconds: 3600 },
  "candidate-auth:request": { max: 3, windowSeconds: 900 },
  "candidate-auth:verify": { max: 10, windowSeconds: 600 },
  "api:trpc": { max: 300, windowSeconds: 60 },
  "api:upload": { max: 30, windowSeconds: 3600 },
  "api:connector-check": { max: 20, windowSeconds: 3600 },
  "api:oauth-start": { max: 10, windowSeconds: 3600 },
  "api:cron": { max: 60, windowSeconds: 60 },
} as const satisfies Record<string, { max: number; windowSeconds: number }>;

export type RateLimitKey = keyof typeof RATE_LIMITS;

export async function checkRateLimit(
  spec: RateLimitSpec,
  identifier: string
): Promise<RateLimitResult> {
  const windowMs = spec.windowSeconds * 1000;
  const windowStart = new Date(Math.floor(Date.now() / windowMs) * windowMs);

  const row = await authPrisma.rateLimit.upsert({
    where: {
      key_identifier_windowStart: {
        key: spec.key,
        identifier,
        windowStart,
      },
    },
    create: {
      key: spec.key,
      identifier,
      windowStart,
      count: 1,
    },
    update: {
      count: { increment: 1 },
    },
  });

  const allowed = row.count <= spec.max;
  return {
    allowed,
    remaining: Math.max(0, spec.max - row.count),
    resetAt: new Date(windowStart.getTime() + windowMs),
  };
}

export async function assertRateLimit(
  key: RateLimitKey,
  identifier: string
): Promise<RateLimitResult> {
  const base = RATE_LIMITS[key];
  const result = await checkRateLimit(
    { key, max: base.max, windowSeconds: base.windowSeconds },
    identifier
  );
  if (!result.allowed) {
    const { RateLimitError } = await import("@/lib/errors");
    throw new RateLimitError(result.resetAt);
  }
  return result;
}

export function clientIpFromHeaders(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (forwarded) return forwarded;
  return headers.get("x-real-ip")?.trim() || "unknown";
}
