import { describe, it, expect } from "vitest";
import { LogSmsChannel } from "@/core/notifications/channels/sms.channel";

describe("SMS channel", () => {
  it("LogSmsDriver returns providerId starting log-sms-", async () => {
    const result = await LogSmsChannel.send({
      to: "+100",
      body: "hi",
    });
    expect(result.providerId.startsWith("log-sms-")).toBe(true);
    expect(result.status).toBe("SENT");
  });
});
