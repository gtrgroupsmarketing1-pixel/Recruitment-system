import { describe, expect, it } from "vitest";
import { authPrisma } from "@/core/db/client";
import { CandidateAuthService, AuthRateLimitError } from "@/modules/candidate-portal/auth.service";
import { verifyCandidateSession } from "@/core/candidate-auth/session";
import { createAuthToken } from "@/core/candidate-auth/tokens";

describe("candidate auth flow", () => {
  it("queues a link, hides misses, consumes once, and rate limits", async () => {
    const stamp = Date.now();
    const tenant = await authPrisma.tenant.create({
      data: { id: `t-ca-${stamp}`, name: "CA", slug: `ca-${stamp}` },
    });
    const email = `can-${stamp}@seed.local`;
    const candidate = await authPrisma.candidate.create({
      data: { id: `c-ca-${stamp}`, tenantId: tenant.id, fullName: "Can", email },
    });
    const before = await authPrisma.candidateAuthToken.count({ where: { candidateId: candidate.id } });
    const ok = await CandidateAuthService.request({
      tenantId: tenant.id,
      identifier: email,
      ipAddress: "1.1.1.1",
      userAgent: "test",
    });
    expect(ok).toEqual({ ok: true });
    const tokens = await authPrisma.candidateAuthToken.findMany({ where: { candidateId: candidate.id } });
    expect(tokens.length).toBe(before + 1);
    expect(tokens[0].tokenHash).not.toContain("http");
    const note = await authPrisma.notification.findFirst({ where: { tenantId: tenant.id, recipientId: candidate.id } });
    expect(note?.status).toBe("QUEUED");

    const miss = await CandidateAuthService.request({
      tenantId: tenant.id,
      identifier: `missing-${stamp}@seed.local`,
      ipAddress: null,
      userAgent: null,
    });
    expect(miss).toEqual({ ok: true });
    expect(await authPrisma.candidateAuthToken.count({ where: { candidateId: candidate.id } })).toBe(1);

    const raw = note?.body.split("token=")[1] ?? "";
    const session = await CandidateAuthService.verifyLink(raw, "1.1.1.1");
    expect(verifyCandidateSession(session?.token ?? "")?.candidateId).toBe(candidate.id);
    const refreshed = await authPrisma.candidate.findFirst({ where: { id: candidate.id } });
    expect(refreshed?.lastLoginAt).toBeTruthy();
    expect(await CandidateAuthService.verifyLink(raw, "1.1.1.1")).toBeNull();

    const expired = await createAuthToken(tenant.id, candidate.id, "EMAIL_LINK", null, null);
    await authPrisma.candidateAuthToken.updateMany({
      where: { id: expired.id },
      data: { expiresAt: new Date(Date.now() - 60_000) },
    });
    expect(await CandidateAuthService.verifyLink(expired.raw, null)).toBeNull();

    await CandidateAuthService.request({ tenantId: tenant.id, identifier: email, ipAddress: null, userAgent: null });
    await CandidateAuthService.request({ tenantId: tenant.id, identifier: email, ipAddress: null, userAgent: null });
    await expect(
      CandidateAuthService.request({ tenantId: tenant.id, identifier: email, ipAddress: null, userAgent: null })
    ).rejects.toBeInstanceOf(AuthRateLimitError);
  });
});
