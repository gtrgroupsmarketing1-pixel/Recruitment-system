import { beforeEach, describe, expect, it } from "vitest";
import { authPrisma } from "@/core/db/client";
import { authorizeCredentials } from "@/core/auth/credentials";
import { RATE_LIMITS, checkRateLimit } from "@/core/security/rate-limit";

describe("brute force limits", () => {
  beforeEach(async () => {
    await authPrisma.rateLimit.deleteMany({
      where: { key: { in: ["auth:login", "auth:signup", "candidate-auth:verify"] } },
    });
  });

  it("rate limits repeated login attempts for the same IP+email", async () => {
    const email = `bf-${Date.now()}@seed.local`;
    const ip = "9.9.9.9";
    const identifier = `${ip}:${email}`;
    const spec = {
      key: "auth:login",
      max: RATE_LIMITS["auth:login"].max,
      windowSeconds: RATE_LIMITS["auth:login"].windowSeconds,
    };
    for (let i = 0; i < RATE_LIMITS["auth:login"].max; i++) {
      const r = await checkRateLimit(spec, identifier);
      expect(r.allowed).toBe(true);
    }
    const blocked = await checkRateLimit(spec, identifier);
    expect(blocked.allowed).toBe(false);
    // authorizeCredentials returns null when limited
    const result = await authorizeCredentials(email, "wrong", "tenant-does-not-matter-when-limited", ip);
    expect(result).toBeNull();
  });

  it("rate limits signup bucket per IP", async () => {
    const identifier = "8.8.8.8";
    const spec = {
      key: "auth:signup",
      max: RATE_LIMITS["auth:signup"].max,
      windowSeconds: RATE_LIMITS["auth:signup"].windowSeconds,
    };
    for (let i = 0; i < RATE_LIMITS["auth:signup"].max; i++) {
      expect((await checkRateLimit(spec, identifier)).allowed).toBe(true);
    }
    expect((await checkRateLimit(spec, identifier)).allowed).toBe(false);
  });
});
