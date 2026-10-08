import { describe, expect, it } from "vitest";
import { validateOrigin } from "@/core/security/origin";

function req(origin: string | null, host: string | null): Request {
  const headers = new Headers();
  if (origin) headers.set("origin", origin);
  if (host) headers.set("host", host);
  return new Request("http://localhost/api/test", { headers });
}

describe("origin validation", () => {
  it("accepts matching origin and rejects missing or wrong host", () => {
    expect(validateOrigin(req("http://acme.localhost:3000", "acme.localhost:3000"))).toBe(true);
    expect(validateOrigin(req(null, "acme.localhost:3000"))).toBe(false);
    expect(validateOrigin(req("http://evil.example", "acme.localhost:3000"))).toBe(false);
  });
});
