import { randomUUID } from "node:crypto";
import { logger } from "@/lib/logger";
import type {
  NotificationChannelDriver,
  SendInput,
  SendResult,
} from "@/core/notifications/channel";
import { CHANNEL_TIMEOUT_MS } from "@/core/notifications/channel";

/** Dev/CI driver — no external call. */
export const LogEmailChannel: NotificationChannelDriver = {
  async send(input: SendInput): Promise<SendResult> {
    const providerId = `log-${randomUUID()}`;
    logger.info(
      { channel: "EMAIL", providerId, toPresent: Boolean(input.to) },
      "email sent via log driver"
    );
    return { providerId, status: "SENT" };
  },
};

/**
 * Postmark via fetch (no SDK).
 * Requires POSTMARK_TOKEN. Caller must only select this when token is set.
 */
export function createPostmarkEmailChannel(
  token: string
): NotificationChannelDriver {
  return {
    async send(input: SendInput): Promise<SendResult> {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), CHANNEL_TIMEOUT_MS);
      try {
        const res = await fetch("https://api.postmarkapp.com/email", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "X-Postmark-Server-Token": token,
          },
          body: JSON.stringify({
            From: process.env.POSTMARK_FROM ?? "noreply@example.com",
            To: input.to,
            Subject: input.subject ?? "(no subject)",
            TextBody: input.body,
            MessageStream: "outbound",
          }),
          signal: controller.signal,
        });
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          return {
            providerId: "",
            status: "FAILED",
            errorMessage: `postmark_${res.status}:${text.slice(0, 200)}`,
          };
        }
        const data = (await res.json()) as { MessageID?: string };
        return {
          providerId: data.MessageID ?? `postmark-${randomUUID()}`,
          status: "SENT",
        };
      } catch (err) {
        const msg =
          err instanceof Error && err.name === "AbortError"
            ? "timeout"
            : err instanceof Error
              ? err.message
              : "unknown";
        return {
          providerId: "",
          status: "FAILED",
          errorMessage: msg,
        };
      } finally {
        clearTimeout(timer);
      }
    },
  };
}
