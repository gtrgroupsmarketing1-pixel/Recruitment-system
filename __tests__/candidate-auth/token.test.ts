import { describe, expect, it } from "vitest";
import { generateToken, hashToken, timingSafeHexEqual } from "@/core/candidate-auth/tokens";

describe("candidate auth tokens", () => {
  it("generates 32-byte tokens and stable hashes", () => {
    const raw = generateToken();
    expect(Buffer.from(raw, "base64url")).toHaveLength(32);
    expect(hashToken(raw)).toBe(hashToken(raw));
    expect(generateToken()).not.toBe(generateToken());
    expect(timingSafeHexEqual(hashToken("123456"), hashToken("123456"))).toBe(true);
    expect(timingSafeHexEqual(hashToken("123456"), hashToken("654321"))).toBe(false);
  });
});
