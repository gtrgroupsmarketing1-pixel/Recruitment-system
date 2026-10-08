import { authPrisma } from "@/core/db/client";
import { createAuthToken, consumeAuthToken, verifySmsCode } from "@/core/candidate-auth/tokens";
import { issueCandidateSession } from "@/core/candidate-auth/session";
import { assertAuthRateLimit } from "@/core/candidate-auth/rate-limit";

export class AuthRateLimitError extends Error {
  status = 429;
}

export const CandidateAuthService = {
  async request(input: {
    tenantId: string;
    identifier: string;
    ipAddress: string | null;
    userAgent: string | null;
  }): Promise<{ ok: true }> {
    const identifier = input.identifier.trim().toLowerCase();
    const candidate = await authPrisma.candidate.findFirst({
      where: {
        tenantId: input.tenantId,
        deletedAt: null,
        OR: [{ email: identifier }, { phone: input.identifier.trim() }, { id: input.identifier.trim() }],
      },
    });
    if (!candidate) return { ok: true };
    try {
      await assertAuthRateLimit(input.tenantId, candidate.id);
    } catch {
      throw new AuthRateLimitError("Too many auth requests");
    }
    const method = candidate.email?.toLowerCase() === identifier ? "EMAIL_LINK" : "SMS_CODE";
    const token = await createAuthToken(input.tenantId, candidate.id, method, input.ipAddress, input.userAgent);
    const base = process.env.CANDIDATE_PORTAL_BASE_URL || "http://localhost:3000";
    const body = method === "EMAIL_LINK"
      ? `Open ${base}/api/candidate-auth/verify?token=${token.raw}`
      : `Your code is ${token.raw}`;
    await authPrisma.notification.create({
      data: {
        tenantId: input.tenantId,
        channel: method === "EMAIL_LINK" ? "EMAIL" : "SMS",
        status: "QUEUED",
        templateKey: method === "EMAIL_LINK" ? "candidate.magic_link" : "candidate.sms_code",
        recipientType: "CANDIDATE",
        recipientId: candidate.id,
        recipientAddr: method === "EMAIL_LINK" ? candidate.email || identifier : candidate.phone || identifier,
        subject: method === "EMAIL_LINK" ? "Your portal link" : null,
        body,
      },
    });
    await authPrisma.auditLog.create({
      data: {
        tenantId: input.tenantId,
        entity: "CandidateAuthToken",
        entityId: token.id,
        field: "created",
        newValue: method,
      },
    });
    return { ok: true };
  },

  async verifyLink(raw: string, ipAddress: string | null): Promise<{ token: string } | null> {
    const consumed = await consumeAuthToken(raw);
    if (!consumed) return null;
    await authPrisma.candidate.updateMany({
      where: { id: consumed.candidateId, tenantId: consumed.tenantId },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress,
        portalStatus: "ACTIVE",
        emailVerifiedAt: consumed.method === "EMAIL_LINK" ? new Date() : undefined,
        phoneVerifiedAt: consumed.method === "SMS_CODE" ? new Date() : undefined,
      },
    });
    return { token: issueCandidateSession(consumed.tenantId, consumed.candidateId) };
  },

  async verifyCode(candidateId: string, code: string, ipAddress: string | null): Promise<{ token: string } | null> {
    const consumed = await verifySmsCode(candidateId, code);
    if (!consumed) return null;
    await authPrisma.candidate.updateMany({
      where: { id: consumed.candidateId, tenantId: consumed.tenantId },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress,
        portalStatus: "ACTIVE",
        phoneVerifiedAt: new Date(),
      },
    });
    return { token: issueCandidateSession(consumed.tenantId, consumed.candidateId) };
  },
};
