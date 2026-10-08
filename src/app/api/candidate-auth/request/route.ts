import { NextResponse } from "next/server";
import { z } from "zod";
import { CandidateAuthService, AuthRateLimitError } from "@/modules/candidate-portal/auth.service";
import { requireOrigin } from "@/core/security/require-origin";
import { extractIp } from "@/core/security/ip";

const BodySchema = z.object({
  identifier: z.string().min(3),
  tenantId: z.string().min(1).optional(),
});

async function readBody(req: Request): Promise<unknown> {
  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return req.json().catch(() => null);
  }
  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    const form = await req.formData();
    return {
      identifier: form.get("identifier"),
      tenantId: form.get("tenantId"),
    };
  }
  return req.json().catch(() => null);
}

export async function POST(req: Request) {
  const bad = requireOrigin(req);
  if (bad) return bad;

  const json = await readBody(req);
  const parsed = BodySchema.safeParse(json);
  // No enumeration: always ok when identifier missing
  if (!parsed.success) {
    return NextResponse.json({ ok: true });
  }
  const tenantId =
    parsed.data.tenantId ||
    req.headers.get("x-tenant-id") ||
    new URL(req.url).searchParams.get("tenantId") ||
    "";
  if (!tenantId) {
    return NextResponse.json({ ok: true });
  }
  try {
    await CandidateAuthService.request({
      tenantId,
      identifier: parsed.data.identifier,
      ipAddress: extractIp(req),
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
