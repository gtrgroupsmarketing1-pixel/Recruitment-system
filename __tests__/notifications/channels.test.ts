import { describe, it, expect, vi, afterEach } from "vitest";
import { LogEmailChannel } from "@/core/notifications/channels/email.channel";
import { LogWhatsAppChannel } from "@/core/notifications/channels/whatsapp.channel";
import { InAppChannel } from "@/core/notifications/channels/in-app.channel";
import { createPostmarkEmailChannel } from "@/core/notifications/channels/email.channel";

describe("notification channels", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("LogEmailChannel returns providerId starting with log-", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const result = await LogEmailChannel.send({
      to: "a@example.com",
      body: "hello",
      subject: "hi",
    });
    expect(result.providerId.startsWith("log-")).toBe(true);
    expect(result.status).toBe("SENT");
    expect(spy).toHaveBeenCalled();
  });

  it("LogWhatsAppChannel returns providerId starting with log-", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const result = await LogWhatsAppChannel.send({
      to: "+971500000000",
      body: "hello",
    });
    expect(result.providerId.startsWith("log-")).toBe(true);
    expect(result.status).toBe("SENT");
    expect(spy).toHaveBeenCalled();
  });

  it("InAppChannel returns DELIVERED", async () => {
    const result = await InAppChannel.send({
      to: "user-1",
      body: "in-app",
    });
    expect(result.status).toBe("DELIVERED");
    expect(result.providerId.startsWith("inapp-")).toBe(true);
  });

  it("postmark driver times out → FAILED status", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(
      (_input, init) =>
        new Promise((_resolve, reject) => {
          const signal = init?.signal;
          if (signal?.aborted) {
            reject(Object.assign(new Error("aborted"), { name: "AbortError" }));
            return;
          }
          signal?.addEventListener("abort", () => {
            reject(Object.assign(new Error("aborted"), { name: "AbortError" }));
          });
        })
    );
    const channel = createPostmarkEmailChannel("tok");
    const result = await channel.send({
      to: "a@example.com",
      subject: "s",
      body: "b",
    });
    expect(result.status).toBe("FAILED");
    expect(result.errorMessage).toBe("timeout");
    fetchSpy.mockRestore();
  }, 12_000);
});
