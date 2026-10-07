import { describe, it, expect } from "vitest";
import { escapeHtml } from "@/lib/html";

describe("escapeHtml", () => {
  it("escapes &, <, >, quotes", () => {
    expect(escapeHtml(`&<>"'`)).toBe("&<>"&#39;");
  });

  it("leaves plain text unchanged", () => {
    expect(escapeHtml("Ravi Kumar")).toBe("Ravi Kumar");
  });

  it("strips raw tags via escaping", () => {
    const out = escapeHtml("A <script>alert(1)</script>");
    expect(out).not.toContain("<script>");
    expect(out).toContain("<script>");
  });
});
