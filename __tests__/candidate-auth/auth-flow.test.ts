import { describe, expect, it } from "vitest";
import { authPrisma } from "@/core/db/client";
import {
  AuthRateLimitError,
  CandidateAuthService,
} from "@/modules/candidate-portal/auth.service";
import { createAuthToken } from "@/core/candidate-auth/tokens";
import { verifyCandidateSession } from "@/core/candidate-auth/session";
import { RATE_LIMITS, checkRateLimit } from "@/core/security/rate-limit";

async function seedCandidate(stamp = Date.now()) {
  const tenant = await authPrisma.tenant.create({
    data: { name: `AuthFlow ${stamp}`, slug: `auth-flow-${stamp}` },
  });
  const email = `af-${stamp}@seed.local`;
  const phone = `+97150${String(stamp).slice(-7)}`;
  const candidate = await authPrisma.candidate.create({
    data: {
      tenantId: tenant.id,
      fullName: "Auth Flow",
      email,
      phone,
    },
  });
  return { tenant, candidate, email, phone };
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
    const row = await authPrisma.candidateAuthToken.findFirst({
      where: { candidateId: candidate.id },
    });
    expect(row?.method).toBe("EMAIL_LINK");
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

  it("request with valid candidate phone creates SMS_CODE token", async () => {
    const { tenant, candidate, phone } = await seedCandidate(Date.now() + 10);
    const res = await CandidateAuthService.request({
      tenantId: tenant.id,
      identifier: phone,
      ipAddress: "2.2.2.2",
      userAgent: null,
    });
    expect(res).toEqual({ ok: true });
    const row = await authPrisma.candidateAuthToken.findFirst({
      where: { candidateId: candidate.id },
    });
    expect(row?.method).toBe("SMS_CODE");
  });

  it("verify with valid email token sets session", async () => {
    const { tenant, candidate, email } = await seedCandidate(Date.now() + 20);
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
  });

  it("verify with used token fails", async () => {
    const { tenant, candidate, email } = await seedCandidate(Date.now() + 30);
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
    expect(await CandidateAuthService.verifyLink(raw, "1.1.1.1")).toBeTruthy();
    expect(await CandidateAuthService.verifyLink(raw, "1.1.1.1")).toBeNull();
  });

  it("verify with expired token fails", async () => {
    const { tenant, candidate } = await seedCandidate(Date.now() + 40);
    const expired = await createAuthToken(tenant.id, candidate.id, "EMAIL_LINK", null, null);
    await authPrisma.candidateAuthToken.updateMany({
      where: { id: expired.id },
      data: { expiresAt: new Date(Date.now() - 60_000) },
    });
    expect(await CandidateAuthService.verifyLink(expired.raw, null)).toBeNull();
  });

  it("verify with tampered token fails", async () => {
    const { tenant, candidate } = await seedCandidate(Date.now() + 50);
    const token = await createAuthToken(tenant.id, candidate.id, "EMAIL_LINK", null, null);
    const tampered = token.raw.slice(0, -4) + "xxxx";
    expect(await CandidateAuthService.verifyLink(tampered, null)).toBeNull();
  });

  it("4th request within window is rate limited", async () => {
    const { tenant, email } = await seedCandidate(Date.now() + 60);
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

  it("11th verify-code attempt for same candidate is rate limited", async () => {
    const { candidate } = await seedCandidate(Date.now() + 70);
    const spec = {
      key: "candidate-auth:verify",
      max: RATE_LIMITS["candidate-auth:verify"].max,
      windowSeconds: RATE_LIMITS["candidate-auth:verify"].windowSeconds,
    };
    for (let i = 0; i < RATE_LIMITS["candidate-auth:verify"].max; i++) {
      expect((await checkRateLimit(spec, candidate.id)).allowed).toBe(true);
    }
    expect((await checkRateLimit(spec, candidate.id)).allowed).toBe(false);
  });

  it("verify-code with wrong code fails", async () => {
    const { tenant, candidate, phone } = await seedCandidate(Date.now() + 80);
    await CandidateAuthService.request({
      tenantId: tenant.id,
      identifier: phone,
      ipAddress: null,
      userAgent: null,
    });
    const result = await CandidateAuthService.verifyCode(candidate.id, "000000", null);
    expect(result).toBeNull();
  });

  it("verify-code with correct code succeeds", async () => {
    const { tenant, candidate } = await seedCandidate(Date.now() + 90);
    const created = await createAuthToken(tenant.id, candidate.id, "SMS_CODE", null, null);
    const result = await CandidateAuthService.verifyCode(candidate.id, created.raw, "3.3.3.3");
    expect(result?.token).toBeTruthy();
    expect(verifyCandidateSession(result?.token ?? "")?.candidateId).toBe(candidate.id);
  });
});
