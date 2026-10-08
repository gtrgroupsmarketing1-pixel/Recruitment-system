import { NextResponse } from "next/server";
import { z } from "zod";
import { CandidateAuthService } from "@/modules/candidate-portal/auth.service";
import { setCandidateSessionCookie } from "@/core/candidate-auth/session";
import { RATE_LIMITS, checkRateLimit } from "@/core/security/rate-limit";
import { requireOrigin } from "@/core/security/require-origin";
import { extractIp } from "@/core/security/ip";

const BodySchema = z.object({
  candidateId: z.string().min(1),
  code: z.string().min(4).max(12),
});

export async function POST(req: Request) {
  const bad = requireOrigin(req);
  if (bad) return bad;

  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const limit = await checkRateLimit(
    {
      key: "candidate-auth:verify",
      max: RATE_LIMITS["candidate-auth:verify"].max,
      windowSeconds: RATE_LIMITS["candidate-auth:verify"].windowSeconds,
    },
    parsed.data.candidateId
  );
  if (!limit.allowed) {
    return NextResponse.json({ ok: false, error: "rate limited" }, { status: 429 });
  }

  const result = await CandidateAuthService.verifyCode(
    parsed.data.candidateId,
    parsed.data.code,
    extractIp(req)
  );
  if (!result) return NextResponse.json({ ok: false }, { status: 400 });
  await setCandidateSessionCookie(result.token);
  return NextResponse.json({ ok: true });
}
