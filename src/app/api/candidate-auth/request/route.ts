import { NextResponse } from "next/server";
import { CandidateAuthService, AuthRateLimitError } from "@/modules/candidate-portal/auth.service";

export async function POST(req: Request) {
  const body = (await req.json()) as { identifier?: string; tenantId?: string };
  const tenantId = body.tenantId || new URL(req.url).searchParams.get("tenantId") || "";
  if (!tenantId || !body.identifier) return NextResponse.json({ ok: true });
  try {
    await CandidateAuthService.request({
      tenantId,
      identifier: body.identifier,
      ipAddress: req.headers.get("x-forwarded-for"),
      userAgent: req.headers.get("user-agent"),
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AuthRateLimitError) {
      return NextResponse.json({ ok: false }, { status: 429 });
    }
    throw error;
  }
}
