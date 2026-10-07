import { describe, it, expect } from "vitest";
import { TEMPLATES, renderTemplate } from "@/core/notifications/templates";

describe("email template html", () => {
  it("every email template has body and bodyHtml", () => {
    for (const [key, tpl] of Object.entries(TEMPLATES)) {
      expect(tpl.body({}).length).toBeGreaterThan(0);
      if (tpl.channel === "EMAIL") {
        expect(tpl.bodyHtml, key).toBeTypeOf("function");
      }
    }
  });

  it("bodyHtml escapes candidate values", () => {
    const html = renderTemplate("document.expiring", {
      documentLabel: `<script>alert(1)</script>`,
      candidateName: `A & B`,
      expiresOn: "2026-12-01",
      daysRemaining: 3,
    }).bodyHtml;
    expect(html).toBeTruthy();
    expect(html).not.toContain("<script>");
    expect(html).toContain("&");
    expect(html).toContain("<script>");
  });
});
