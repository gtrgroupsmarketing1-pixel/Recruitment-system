import { describe, it, expect } from "vitest";
import { ensureFreshToken } from "@/core/drive/token";

describe("token refresh", () => {
  it("returns a fresh token as-is", async () => {
    const result = await ensureFreshToken({
      accessToken: "live",
      tokenExpiresAt: new Date(Date.now() + 60 * 60_000),
      refresh: async () => {
        throw new Error("should not refresh");
      },
    });
    expect(result.refreshed).toBe(false);
    expect(result.accessToken).toBe("live");
  });

  it("refreshes a near-expiry token", async () => {
    const result = await ensureFreshToken({
      accessToken: "old",
      tokenExpiresAt: new Date(Date.now() + 60_000),
      refresh: async () => ({ access_token: "new", expires_in: 3600 }),
    });
    expect(result.refreshed).toBe(true);
    expect(result.accessToken).toBe("new");
    expect(result.tokenExpiresAt.getTime()).toBeGreaterThan(Date.now() + 3_000_000);
  });
});
