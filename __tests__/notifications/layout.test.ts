import { describe, it, expect } from "vitest";
import { renderEmailHtml } from "@/core/notifications/email.layout";

describe("email layout", () => {
  it("wraps content", () => {
    const html = renderEmailHtml("<p>Hello</p>", null);
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("<p>Hello</p>");
  });

  it("renders signature when present", () => {
    const html = renderEmailHtml("<p>Hi</p>", "<p>Acme</p>");
    expect(html).toContain("Acme");
    expect(html).toContain("border-top");
  });

  it("omits signature block when null", () => {
    const html = renderEmailHtml("<p>Hi</p>", null);
    expect(html).not.toContain("border-top");
  });
});
