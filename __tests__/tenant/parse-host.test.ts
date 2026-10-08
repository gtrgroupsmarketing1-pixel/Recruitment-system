import { describe, expect, it } from "vitest";
import { parseHost } from "@/core/tenant/resolver";

describe("parseHost", () => {
  it("classifies root, reserved, subdomain, custom, and ports", () => {
    expect(parseHost("acme.example.com", "example.com")).toEqual({ kind: "SUBDOMAIN", slug: "acme" });
    expect(parseHost("www.example.com", "example.com")).toEqual({ kind: "ROOT" });
    expect(parseHost("example.com", "example.com")).toEqual({ kind: "ROOT" });
    expect(parseHost("app.example.com", "example.com")).toEqual({ kind: "ROOT" });
    expect(parseHost("acme.customdomain.io", "example.com")).toEqual({ kind: "CUSTOM" });
    expect(parseHost("acme.example.com:3000", "example.com")).toEqual({ kind: "SUBDOMAIN", slug: "acme" });
  });
});
