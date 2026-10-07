import { describe, it, expect } from "vitest";
import { escapeHtml } from "@/lib/html";

describe("escapeHtml", () => {
  it("escapes ampersand, brackets, and quotes", () => {
    expect(escapeHtml("a&b")).toBe("a\u0026amp;b");
    expect(escapeHtml("a<b>")).toBe("a\u0026lt;b\u0026gt;");
    expect(escapeHtml('"')).toBe("\u0026quot;");
    expect(escapeHtml("'")).toBe("\u0026#39;");
  });

  it("leaves plain text unchanged", () => {
    expect(escapeHtml("Ravi Kumar")).toBe("Ravi Kumar");
  });

  it("escapes a script tag so no raw tag remains", () => {
    const out = escapeHtml("A <script>alert(1)</script>");
    expect(out.includes("<script>")).toBe(false);
    expect(out).toContain("\u0026lt;script\u0026gt;");
  });
});
