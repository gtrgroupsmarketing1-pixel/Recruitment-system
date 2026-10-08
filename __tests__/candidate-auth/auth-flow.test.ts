import { describe, expect, it } from "vitest";
import { authPrisma } from "@/core/db/client";
import {
  AuthRateLimitError,
  CandidateAuthService,
} from "@/modules/candidate-portal/auth.service";
import { createAuthToken } from "@/core/candidate-auth/tokens";
import { verifyCandidateSession } from "@/core/candidate-auth/session";

async function seedCandidate(stamp = Date.now()) {
  const tenant = await authPrisma.tenant.create({
    data: { name: `AuthFlow ${stamp}`, slug: `auth-flow-${stamp}` },
  });
  const email = `af-${stamp}@seed.local`;
  const candidate = await authPrisma.candidate.create({
    data: {
      tenantId: tenant.id,
      fullName: "Auth Flow",
      email,
      phone: `+97150${String(stamp).slice(-7)}`,
    },
  });
  return { tenant, candidate, email };
}

describe("candidate auth flow", () => {
  it("request with valid candidate email creates a token row", async () => {
    const { tenant, candidate, email } = await seedCandidate();
    const res = await CandidateAuthService.request({
      tenantId: tenant.id,
      identifier: email,
      ipAddress: "1.1.1.1",
      userAgent: null,
    });
    expect(res).toEqual({ ok: true });
    expect(
      await authPrisma.candidateAuthToken.count({ where: { candidateId: candidate.id } })
    ).toBe(1);
  });

  it("request with unknown email returns ok and creates no token", async () => {
    const stamp = Date.now();
    const tenant = await authPrisma.tenant.create({
      data: { name: `Miss ${stamp}`, slug: `miss-${stamp}` },
    });
    const res = await CandidateAuthService.request({
      tenantId: tenant.id,
      identifier: `missing-${stamp}@seed.local`,
      ipAddress: null,
      userAgent: null,
    });
    expect(res).toEqual({ ok: true });
    expect(await authPrisma.candidateAuthToken.count({ where: { tenantId: tenant.id } })).toBe(0);
  });

  it("verify with valid email token sets session; reused token fails", async () => {
    const { tenant, candidate, email } = await seedCandidate(Date.now() + 1);
    await CandidateAuthService.request({
      tenantId: tenant.id,
      identifier: email,
      ipAddress: null,
      userAgent: null,
    });
    const note = await authPrisma.notification.findFirst({
      where: { tenantId: tenant.id, recipientId: candidate.id },
      orderBy: { createdAt: "desc" },
    });
    const raw = note?.body.split("token=")[1] ?? "";
    const session = await CandidateAuthService.verifyLink(raw, "1.1.1.1");
    expect(verifyCandidateSession(session?.token ?? "")?.candidateId).toBe(candidate.id);
    expect(await CandidateAuthService.verifyLink(raw, "1.1.1.1")).toBeNull();
  });

  it("verify with expired token returns null", async () => {
    const { tenant, candidate } = await seedCandidate(Date.now() + 2);
    const expired = await createAuthToken(tenant.id, candidate.id, "EMAIL_LINK", null, null);
    await authPrisma.candidateAuthToken.updateMany({
      where: { id: expired.id },
      data: { expiresAt: new Date(Date.now() - 60_000) },
    });
    expect(await CandidateAuthService.verifyLink(expired.raw, null)).toBeNull();
  });

  it("4th request within window is rate limited", async () => {
    const { tenant, email } = await seedCandidate(Date.now() + 3);
    await CandidateAuthService.request({
      tenantId: tenant.id,
      identifier: email,
      ipAddress: null,
      userAgent: null,
    });
    await CandidateAuthService.request({
      tenantId: tenant.id,
      identifier: email,
      ipAddress: null,
      userAgent: null,
    });
    await CandidateAuthService.request({
      tenantId: tenant.id,
      identifier: email,
      ipAddress: null,
      userAgent: null,
    });
    await expect(
      CandidateAuthService.request({
        tenantId: tenant.id,
        identifier: email,
        ipAddress: null,
        userAgent: null,
      })
    ).rejects.toBeInstanceOf(AuthRateLimitError);
  });
});
