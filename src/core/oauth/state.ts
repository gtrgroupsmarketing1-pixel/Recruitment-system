import { createHmac, timingSafeEqual } from "node:crypto";

export type OAuthState = {
  tenantId: string;
  userId: string;
  provider: "google" | "microsoft";
  nonce: string;
  exp: number;
};

function secret(): string {
  return process.env.OAUTH_STATE_SECRET || "dev-oauth-state";
}

export function signState(input: Omit<OAuthState, "exp">, ttlSec = 600): string {
  const payload: OAuthState = { ...input, exp: Math.floor(Date.now() / 1000) + ttlSec };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifyState(token: string, nowSec = Math.floor(Date.now() / 1000)): OAuthState | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = createHmac("sha256", secret()).update(body).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  let payload: OAuthState;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as OAuthState;
  } catch {
    return null;
  }
  if (!payload.exp || payload.exp < nowSec) return null;
  if (payload.provider !== "google" && payload.provider !== "microsoft") return null;
  return payload;
}
