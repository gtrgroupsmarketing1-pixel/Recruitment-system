import { auth } from "@/core/auth/auth.config";
import { verifyCandidateSession } from "@/core/candidate-auth/session";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function isCandidatePublic(pathname: string): boolean {
  return pathname.startsWith("/candidate/login")
    || pathname.startsWith("/candidate/verify")
    || pathname.startsWith("/api/candidate-auth");
}

export default auth((req) => {
  const pathname = req.nextUrl.pathname;
  if (pathname.startsWith("/candidate") || pathname.startsWith("/api/candidate-auth")) {
    if (isCandidatePublic(pathname)) return NextResponse.next();
    const raw = req.cookies.get("candidate_session")?.value;
    const session = raw ? verifyCandidateSession(raw) : null;
    if (!session) return NextResponse.redirect(new URL("/candidate/login", req.url));
    return NextResponse.next();
  }
  const tenantId = req.auth?.tenantId;
  if (!tenantId) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-tenant-id", tenantId);
  return NextResponse.next({ request: { headers: requestHeaders } });
});

export const config = {
  matcher: ["/((?!login|signup|_next|favicon.ico|api/auth).*)"],
};
