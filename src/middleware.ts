import { auth } from "@/core/auth/auth.config";
import { runWithTenant } from "@/core/db/tenant-context";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export default auth((req) => {
  const tenantId = req.auth?.tenantId;
  if (!tenantId) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-tenant-id", tenantId);
  return runWithTenant(tenantId, async () =>
    NextResponse.next({ request: { headers: requestHeaders } })
  );
});

export const config = {
  matcher: ["/((?!login|signup|_next|favicon.ico|api/auth).*)"],
};
