import { describe, expect, it } from "vitest";

/**
 * Middleware applies headers at the edge. Unit-check the production CSP policy
 * shape without bootstrapping NextAuth middleware.
 */
function buildSecurityHeaders(nodeEnv: string): Record<string, string> {
  const headers: Record<string, string> = {
    "Strict-Transport-Security": "max-age=604800; includeSubDomains",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), interest-cohort=()",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-origin",
  };
  if (nodeEnv === "production") {
    headers["Content-Security-Policy-Report-Only"] = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "frame-ancestors 'none'",
    ].join("; ");
  }
  return headers;
}

describe("csp headers", () => {
  it("uses report-only CSP in production and short HSTS", () => {
    const prod = buildSecurityHeaders("production");
    expect(prod["Content-Security-Policy-Report-Only"]).toContain("default-src 'self'");
    expect(prod["Content-Security-Policy"]).toBeUndefined();
    expect(prod["Strict-Transport-Security"]).toContain("max-age=604800");
    expect(prod["X-Frame-Options"]).toBe("DENY");

    const dev = buildSecurityHeaders("development");
    expect(dev["Content-Security-Policy-Report-Only"]).toBeUndefined();
    expect(dev["X-Content-Type-Options"]).toBe("nosniff");
  });
});
