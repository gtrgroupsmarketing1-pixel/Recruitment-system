import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { authPrisma } from "@/core/db/client";
import type { CandidateAuthMethod } from "@prisma/client";

export function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export function timingSafeHexEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function minutes(name: string, fallback: number): number {
  return Number(process.env[name] ?? fallback);
}

export async function createAuthToken(
  tenantId: string,
  candidateId: string,
  method: CandidateAuthMethod,
  ipAddress: string | null,
  userAgent: string | null
): Promise<{ raw: string; expiresAt: Date; id: string }> {
  const raw = method === "SMS_CODE"
    ? String(randomBytes(4).readUInt32BE(0) % 1_000_000).padStart(Number(process.env.SMS_CODE_LENGTH ?? 6), "0")
    : generateToken();
  const ttl = method === "SMS_CODE" ? minutes("SMS_CODE_TTL_MINUTES", 10) : minutes("MAGIC_LINK_TTL_MINUTES", 15);
  const expiresAt = new Date(Date.now() + ttl * 60_000);
  const row = await authPrisma.candidateAuthToken.create({
    data: {
      tenantId,
      candidateId,
      method,
      tokenHash: hashToken(raw),
      expiresAt,
      ipAddress,
      userAgent,
    },
  });
  return { raw, expiresAt, id: row.id };
}

export async function consumeAuthToken(raw: string): Promise<{ tenantId: string; candidateId: string; method: CandidateAuthMethod } | null> {
  const tokenHash = hashToken(raw);
  const row = await authPrisma.candidateAuthToken.findFirst({ where: { tokenHash } });
  if (!row || row.usedAt || row.expiresAt.getTime() <= Date.now()) return null;
  await authPrisma.candidateAuthToken.updateMany({
    where: { id: row.id, usedAt: null },
    data: { usedAt: new Date() },
  });
  return { tenantId: row.tenantId, candidateId: row.candidateId, method: row.method };
}

export async function verifySmsCode(candidateId: string, code: string): Promise<{ tenantId: string; candidateId: string } | null> {
  const since = new Date(Date.now() - minutes("SMS_CODE_TTL_MINUTES", 10) * 60_000);
  const rows = await authPrisma.candidateAuthToken.findMany({
    where: { candidateId, method: "SMS_CODE", usedAt: null, expiresAt: { gt: new Date() }, createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
  const supplied = hashToken(code);
  for (const row of rows) {
    if (timingSafeHexEqual(supplied, row.tokenHash)) {
      await authPrisma.candidateAuthToken.updateMany({
        where: { id: row.id, usedAt: null },
        data: { usedAt: new Date() },
      });
      return { tenantId: row.tenantId, candidateId: row.candidateId };
    }
  }
  return null;
}
