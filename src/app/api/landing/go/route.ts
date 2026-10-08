// Redirect helper — no untrusted body parse needed.
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const slug = new URL(req.url).searchParams.get("slug")?.trim().toLowerCase();
  const root = process.env.ROOT_DOMAIN || "localhost";
  if (!slug) return NextResponse.redirect(new URL("/landing", req.url));
  const proto = root.includes("localhost") ? "http" : "https";
  return NextResponse.redirect(`${proto}://${slug}.${root}/login`);
}
