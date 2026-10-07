import { NextRequest, NextResponse } from "next/server";
import { storage, verifyStorageSig } from "@/core/storage/storage.client";

export async function PUT(req: NextRequest): Promise<NextResponse> {
  const key = req.nextUrl.searchParams.get("key") ?? "";
  const exp = Number(req.nextUrl.searchParams.get("exp") ?? "0");
  const sig = req.nextUrl.searchParams.get("sig") ?? "";
  const mime = req.nextUrl.searchParams.get("mime") ?? "application/octet-stream";
  if (!verifyStorageSig(key, exp, sig)) return NextResponse.json({ error: "expired" }, { status: 403 });
  const bytes = Buffer.from(await req.arrayBuffer());
  await storage.writeObject(key, bytes, mime);
  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const key = req.nextUrl.searchParams.get("key") ?? "";
  const exp = Number(req.nextUrl.searchParams.get("exp") ?? "0");
  const sig = req.nextUrl.searchParams.get("sig") ?? "";
  if (!verifyStorageSig(key, exp, sig)) return NextResponse.json({ error: "expired" }, { status: 403 });
  const head = await storage.headObject(key);
  if (!head) return NextResponse.json({ error: "missing" }, { status: 404 });
  return NextResponse.json({ size: head.size, contentType: head.contentType });
}
