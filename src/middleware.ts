import { auth } from "@/core/auth/auth.config";
import { verifyCandidateSession } from "@/core/candidate-auth/session";
import { resolveTenantFromHost } from "@/core/tenant/resolver";
import { NextResponse } from "next/server";

function applySecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set("Strict-Transport-Security", "max-age=604800; includeSubDomains");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()"
  );
  res.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  res.headers.set("Cross-Origin-Resource-Policy", "same-origin");
  if (process.env.NODE_ENV === "production") {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://*.amazonaws.com https://*.r2.cloudflarestorage.com",
      "font-src 'self' data:",
      "connect-src 'self' https://api.postmarkapp.com https://api.twilio.com https://graph.facebook.com https://www.googleapis.com https://graph.microsoft.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      "upgrade-insecure-requests",
    ].join("; ");
    res.headers.set("Content-Security-Policy-Report-Only", csp);
  }
  return res;
}

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

  // Early returns — no tenant resolution or auth required:
  // - /landing: public marketing page
  // - /api/locale: language switcher
  // - /api/auth: NextAuth's own callback URLs (must not be intercepted)
  if (
    pathname.startsWith("/landing") ||
    pathname.startsWith("/api/locale") ||
    pathname.startsWith("/api/auth")
  ) {
    return applySecurityHeaders(NextResponse.next());
  }

  if (pathname.startsWith("/candidate") || pathname.startsWith("/api/candidate-auth")) {
    if (!isCandidatePublic(pathname)) {
      const raw = req.cookies.get("candidate_session")?.value;
      const session = raw ? verifyCandidateSession(raw) : null;
      if (!session) return NextResponse.redirect(new URL("/candidate/login", req.url));
    }
    const res = applySecurityHeaders(NextResponse.next());
    if (tenant) {
      res.headers.set("x-tenant-id", tenant.id);
      res.headers.set("x-tenant-slug", tenant.slug);
      res.headers.set("x-tenant-branding", brandingHeader(tenant));
    }
    return res;
  }

  if ((pathname === "/login" || pathname === "/signup") && !tenant) {
    return applySecurityHeaders(NextResponse.next());
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

  return applySecurityHeaders(NextResponse.next({ request: { headers: requestHeaders } }));
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * Note: /api and /login are now INCLUDED so tenant resolution runs
     * on auth callbacks.
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};