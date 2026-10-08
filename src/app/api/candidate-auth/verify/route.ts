import { NextResponse } from "next/server";
import { CandidateAuthService } from "@/modules/candidate-portal/auth.service";
import { setCandidateSessionCookie } from "@/core/candidate-auth/session";

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token") || "";
  const result = await CandidateAuthService.verifyLink(token, req.headers.get("x-forwarded-for"));
  if (!result) return NextResponse.json({ ok: false }, { status: 400 });
  await setCandidateSessionCookie(result.token);
  return NextResponse.redirect(new URL("/candidate/dashboard", req.url));
}
