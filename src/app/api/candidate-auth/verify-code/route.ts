import { NextResponse } from "next/server";
import { CandidateAuthService } from "@/modules/candidate-portal/auth.service";
import { setCandidateSessionCookie } from "@/core/candidate-auth/session";

export async function POST(req: Request) {
  const body = (await req.json()) as { candidateId?: string; code?: string };
  if (!body.candidateId || !body.code) return NextResponse.json({ ok: false }, { status: 400 });
  const result = await CandidateAuthService.verifyCode(body.candidateId, body.code, req.headers.get("x-forwarded-for"));
  if (!result) return NextResponse.json({ ok: false }, { status: 400 });
  await setCandidateSessionCookie(result.token);
  return NextResponse.json({ ok: true, redirect: "/candidate/dashboard" });
}
