import { describe, expect, it } from "vitest";
import { signCandidateSession, verifyCandidateSession } from "@/core/candidate-auth/session";

describe("candidate session", () => {
  it("round-trips and rejects tamper, expiry, and the wrong secret", () => {
    const token = signCandidateSession({
      kind: "CANDIDATE",
      tenantId: "t",
      candidateId: "c",
      issuedAt: Date.now(),
      expiresAt: Date.now() + 60_000,
    });
    expect(verifyCandidateSession(token)?.candidateId).toBe("c");
    expect(verifyCandidateSession(`${token}x`)).toBeNull();
    const expired = signCandidateSession({
      kind: "CANDIDATE",
      tenantId: "t",
      candidateId: "c",
      issuedAt: Date.now() - 120_000,
      expiresAt: Date.now() - 60_000,
    });
    expect(verifyCandidateSession(expired)).toBeNull();
    const previous = process.env.CANDIDATE_SESSION_SECRET;
    process.env.CANDIDATE_SESSION_SECRET = "other-secret-other-secret-other-secret";
    const foreign = signCandidateSession({
      kind: "CANDIDATE",
      tenantId: "t",
      candidateId: "c",
      issuedAt: Date.now(),
      expiresAt: Date.now() + 60_000,
    });
    process.env.CANDIDATE_SESSION_SECRET = previous;
    expect(verifyCandidateSession(foreign)).toBeNull();
  });
});
