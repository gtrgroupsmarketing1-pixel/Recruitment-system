import { beforeEach, describe, expect, it } from "vitest";
import { authPrisma } from "@/core/db/client";
import { checkRateLimit } from "@/core/security/rate-limit";

describe("rate limit", () => {
  beforeEach(async () => {
    await authPrisma.rateLimit.deleteMany({
      where: { key: "test:bucket" },
    });
  });

  it("allows within limit and rejects past max", async () => {
    const spec = { key: "test:bucket", max: 3, windowSeconds: 60 };
    const id = `id-${Date.now()}`;
    const a = await checkRateLimit(spec, id);
    const b = await checkRateLimit(spec, id);
    const c = await checkRateLimit(spec, id);
    const d = await checkRateLimit(spec, id);
    expect(a.allowed).toBe(true);
    expect(b.allowed).toBe(true);
    expect(c.allowed).toBe(true);
    expect(d.allowed).toBe(false);
    expect(d.remaining).toBe(0);
  });
});
