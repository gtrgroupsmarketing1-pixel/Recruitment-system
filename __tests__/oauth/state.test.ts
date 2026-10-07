import { describe, it, expect, beforeAll } from "vitest";
import { signState, verifyState } from "@/core/oauth/state";

beforeAll(() => {
  process.env.OAUTH_STATE_SECRET = "test-oauth-state-secret";
});

describe("oauth state", () => {
  it("round-trips", () => {
    const token = signState({
      tenantId: "t1",
      userId: "u1",
      provider: "google",
      nonce: "n1",
    });
    const claims = verifyState(token);
    expect(claims?.tenantId).toBe("t1");
    expect(claims?.userId).toBe("u1");
    expect(claims?.provider).toBe("google");
    expect(claims?.nonce).toBe("n1");
  });

  it("expired state returns null", () => {
    const token = signState(
      { tenantId: "t1", userId: "u1", provider: "microsoft", nonce: "n" },
      -10
    );
    expect(verifyState(token)).toBeNull();
  });

  it("tampered state returns null", () => {
    const token = signState({ tenantId: "t1", userId: "u1", provider: "google", nonce: "n" });
    const [body, sig] = token.split(".");
    expect(verifyState(`${body}x.${sig}`)).toBeNull();
  });

  it("wrong secret returns null", () => {
    const token = signState({ tenantId: "t1", userId: "u1", provider: "google", nonce: "n" });
    process.env.OAUTH_STATE_SECRET = "other-secret";
    expect(verifyState(token)).toBeNull();
    process.env.OAUTH_STATE_SECRET = "test-oauth-state-secret";
  });
});
