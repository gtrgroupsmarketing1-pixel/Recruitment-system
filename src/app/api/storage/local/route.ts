// Signed query params; body is binary blob validated by storage signature.
import { NextRequest, NextResponse } from "next/server";
import { getStorage, verifyStorageSig } from "@/core/storage/storage.client";
import { RATE_LIMITS, checkRateLimit } from "@/core/security/rate-limit";
import { extractIp } from "@/core/security/ip";

// Signed URL upload/download — not cookie-session CSRF; Origin check exempt.
// Rate limit by IP to bound storage write floods.
export async function PUT(req: NextRequest): Promise<NextResponse> {
  const ip = extractIp(req);
  const limit = await checkRateLimit(
    {
      key: "api:upload",
      max: RATE_LIMITS["api:upload"].max,
      windowSeconds: RATE_LIMITS["api:upload"].windowSeconds,
    },
    ip
  );
  if (!limit.allowed) {
    return NextResponse.json({ error: "rate limited" }, { status: 429 });
  }
  const key = req.nextUrl.searchParams.get("key") ?? "";
  const exp = Number(req.nextUrl.searchParams.get("exp") ?? "0");
  const sig = req.nextUrl.searchParams.get("sig") ?? "";
  const mime = req.nextUrl.searchParams.get("mime") ?? "application/octet-stream";
  if (!verifyStorageSig(key, exp, sig)) return NextResponse.json({ error: "expired" }, { status: 403 });
  const bytes = Buffer.from(await req.arrayBuffer());
  await getStorage().writeObject(key, bytes, mime);
  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  // Signed URL download — Origin check exempt (same as PUT).
  const key = req.nextUrl.searchParams.get("key") ?? "";
  const exp = Number(req.nextUrl.searchParams.get("exp") ?? "0");
  const sig = req.nextUrl.searchParams.get("sig") ?? "";
  if (!verifyStorageSig(key, exp, sig)) return NextResponse.json({ error: "expired" }, { status: 403 });
  const head = await getStorage().headObject(key);
  if (!head) return NextResponse.json({ error: "missing" }, { status: 404 });
  return NextResponse.json({ size: head.size, contentType: head.contentType });
}
