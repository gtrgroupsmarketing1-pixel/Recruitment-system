import { describe, it, expect } from "vitest";
import { buildPostmarkPayload } from "@/core/notifications/channels/email.channel";
import { DEFAULT_SENDER } from "@/modules/notification/sender.resolver";

describe("email channel payload", () => {
  it("includes HtmlBody when bodyHtml present", () => {
    const payload = buildPostmarkPayload({
      to: "a@b.com",
      subject: "Sub",
      body: "plain",
      htmlBody: "<p>html</p>",
      sender: {
        fromName: "Acme",
        fromEmail: "recruit@acme.example",
        replyToEmail: "support@acme.example",
      },
    });
    expect(payload.HtmlBody).toBe("<p>html</p>");
    expect(payload.TextBody).toBe("plain");
    expect(payload.From).toBe("Acme <recruit@acme.example>");
    expect(payload.ReplyTo).toBe("support@acme.example");
  });

  it("falls back to default sender", () => {
    const payload = buildPostmarkPayload({
      to: "a@b.com",
      body: "plain",
    });
    expect(payload.From).toBe(
      `${DEFAULT_SENDER.fromName} <${DEFAULT_SENDER.fromEmail}>`
    );
  });
});
