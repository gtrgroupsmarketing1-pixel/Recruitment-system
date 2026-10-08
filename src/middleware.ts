import { auth } from "@/core/auth/auth.config";
import { verifyCandidateSession } from "@/core/candidate-auth/session";
import { resolveTenantFromHost } from "@/core/tenant/resolver";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function isCandidatePublic(pathname: string): boolean {
  return pathname.startsWith("/candidate/login")
    || pathname.startsWith("/candidate/verify")
    || pathname.startsWith("/api/candidate-auth");
}

function brandingHeader(tenant: {
  displayName: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
  defaultLocale: string;
  defaultDirection: string;
}) {
  return JSON.stringify({
    displayName: tenant.displayName,
    logoUrl: tenant.logoUrl,
    primaryColor: tenant.primaryColor,
    defaultLocale: tenant.defaultLocale,
    defaultDirection: tenant.defaultDirection,
  });
}

export default auth(async (req) => {
  const pathname = req.nextUrl.pathname;
  const host = req.headers.get("host") ?? "";
  const tenant = await resolveTenantFromHost(host);
  if (pathname.startsWith("/landing") || pathname.startsWith("/api/locale")) {
    return NextResponse.next();
  }
  if (pathname.startsWith("/candidate") || pathname.startsWith("/api/candidate-auth")) {
    if (!isCandidatePublic(pathname)) {
      const raw = req.cookies.get("candidate_session")?.value;
      const session = raw ? verifyCandidateSession(raw) : null;
      if (!session) return NextResponse.redirect(new URL("/candidate/login", req.url));
    }
    const res = NextResponse.next();
    if (tenant) {
      res.headers.set("x-tenant-id", tenant.id);
      res.headers.set("x-tenant-slug", tenant.slug);
      res.headers.set("x-tenant-branding", brandingHeader(tenant));
    }
    return res;
  }
  if ((pathname === "/login" || pathname === "/signup") && !tenant) {
    return NextResponse.next();
  }
  if (!tenant && pathname === "/") {
    return NextResponse.rewrite(new URL("/landing", req.url));
  }
  if (!tenant) {
    return NextResponse.redirect(new URL("/landing?error=no-tenant", req.url));
  }
  if (!req.auth?.tenantId && pathname !== "/login" && pathname !== "/signup") {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-tenant-id", tenant.id);
  requestHeaders.set("x-tenant-slug", tenant.slug);
  requestHeaders.set("x-tenant-branding", brandingHeader(tenant));
  return NextResponse.next({ request: { headers: requestHeaders } });
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"],
};
