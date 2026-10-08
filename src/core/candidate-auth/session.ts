import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { UnauthorizedError } from "@/lib/errors";

export type CandidateSession = {
  kind: "CANDIDATE";
  tenantId: string;
  candidateId: string;
  issuedAt: number;
  expiresAt: number;
};

const COOKIE = "candidate_session";

function secret(): string {
  return process.env.CANDIDATE_SESSION_SECRET || "candidate-session-test-secret-32b";
}

function ttlMs(): number {
  const days = Number(process.env.CANDIDATE_SESSION_TTL_DAYS ?? 30);
  return days * 86_400_000;
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

export function signCandidateSession(session: CandidateSession): string {
  const body = b64url(JSON.stringify(session));
  const sig = createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifyCandidateSession(token: string): CandidateSession | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = createHmac("sha256", secret()).update(body).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as CandidateSession;
    if (parsed.kind !== "CANDIDATE") return null;
    if (parsed.expiresAt <= Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function issueCandidateSession(tenantId: string, candidateId: string): string {
  const issuedAt = Date.now();
  return signCandidateSession({
    kind: "CANDIDATE",
    tenantId,
    candidateId,
    issuedAt,
    expiresAt: issuedAt + ttlMs(),
  });
}

export async function getCandidateSession(): Promise<CandidateSession | null> {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (!raw) return null;
  return verifyCandidateSession(raw);
}

export async function requireCandidateSession(): Promise<CandidateSession> {
  const session = await getCandidateSession();
  if (!session) throw new UnauthorizedError("Candidate session required");
  return session;
}

export async function setCandidateSessionCookie(token: string): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(ttlMs() / 1000),
  });
}

export async function clearCandidateSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export function assertNoCandidateOnStaffApi(candidateCookie: string | undefined, hasStaff: boolean): void {
  if (candidateCookie && !hasStaff) {
    throw new UnauthorizedError("Candidate session cannot access staff API");
  }
}
