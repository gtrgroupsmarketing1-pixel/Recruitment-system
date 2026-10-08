// Magic-link GET — token query string validated below.
import { z } from "zod";
import { NextResponse } from "next/server";
import { CandidateAuthService } from "@/modules/candidate-portal/auth.service";
import { setCandidateSessionCookie } from "@/core/candidate-auth/session";
import { extractIp } from "@/core/security/ip";

const TokenSchema = z.object({ token: z.string().min(8) });

export async function GET(req: Request) {
  // GET navigation from email client — Origin check exempt.
  const parsed = TokenSchema.safeParse({
    token: new URL(req.url).searchParams.get("token") || "",
  });
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });
  const result = await CandidateAuthService.verifyLink(parsed.data.token, extractIp(req));
  if (!result) return NextResponse.json({ ok: false }, { status: 400 });
  await setCandidateSessionCookie(result.token);
  return NextResponse.redirect(new URL("/candidate/dashboard", req.url));
}
