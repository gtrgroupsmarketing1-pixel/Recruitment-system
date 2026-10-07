import { randomUUID } from "node:crypto";
import { logger } from "@/lib/logger";
import type {
  NotificationChannelDriver,
  SendInput,
  SendResult,
} from "@/core/notifications/channel";
import { CHANNEL_TIMEOUT_MS } from "@/core/notifications/channel";
import { DEFAULT_SENDER, formatFrom } from "@/modules/notification/sender.resolver";

function senderOf(input: SendInput) {
  return input.sender ?? DEFAULT_SENDER;
}

/** Dev/CI driver — no external call. Returns a log provider id. */
export const LogEmailChannel: NotificationChannelDriver = {
  async send(input: SendInput): Promise<SendResult> {
    const providerId = `log-${randomUUID()}`;
    const sender = senderOf(input);
    logger.info(
      {
        channel: "EMAIL",
        providerId,
        toPresent: Boolean(input.to),
        fromEmail: sender.fromEmail,
        hasHtml: Boolean(input.htmlBody),
      },
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
      const sender = senderOf(input);
      try {
        const res = await fetch("https://api.postmarkapp.com/email", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "X-Postmark-Server-Token": token,
          },
          body: JSON.stringify({
            From: formatFrom(sender),
            To: input.to,
            ReplyTo: sender.replyToEmail ?? undefined,
            Subject: input.subject ?? "(no subject)",
            TextBody: input.body,
            HtmlBody: input.htmlBody,
            MessageStream: "outbound",
            Metadata: input.metadata,
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

/** Build the Postmark JSON body. Pure — used by tests. */
export function buildPostmarkPayload(input: SendInput): Record<string, unknown> {
  const sender = senderOf(input);
  return {
    From: formatFrom(sender),
    To: input.to,
    ReplyTo: sender.replyToEmail ?? undefined,
    Subject: input.subject ?? "(no subject)",
    TextBody: input.body,
    HtmlBody: input.htmlBody,
    MessageStream: "outbound",
    Metadata: input.metadata,
  };
}
