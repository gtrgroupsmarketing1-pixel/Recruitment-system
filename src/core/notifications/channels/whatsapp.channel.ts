import { randomUUID } from "node:crypto";
import { logger } from "@/lib/logger";
import type {
  NotificationChannelDriver,
  SendInput,
  SendResult,
} from "@/core/notifications/channel";
import { CHANNEL_TIMEOUT_MS } from "@/core/notifications/channel";

/** Dev/CI driver — no external call. */
export const LogWhatsAppChannel: NotificationChannelDriver = {
  async send(input: SendInput): Promise<SendResult> {
    const providerId = `log-${randomUUID()}`;
    logger.info(
      { channel: "WHATSAPP", providerId, toPresent: Boolean(input.to) },
      "whatsapp sent via log driver"
    );
    return { providerId, status: "SENT" };
  },
};

/**
 * Meta WhatsApp Cloud API via fetch (no SDK).
 * Requires META_WHATSAPP_TOKEN + META_WHATSAPP_PHONE_ID.
 */
export function createMetaWhatsAppChannel(
  token: string,
  phoneNumberId: string
): NotificationChannelDriver {
  return {
    async send(input: SendInput): Promise<SendResult> {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), CHANNEL_TIMEOUT_MS);
      const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: input.to,
            type: "text",
            text: { body: input.body },
          }),
          signal: controller.signal,
        });
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          return {
            providerId: "",
            status: "FAILED",
            errorMessage: `meta_${res.status}:${text.slice(0, 200)}`,
          };
        }
        const data = (await res.json()) as {
          messages?: Array<{ id?: string }>;
        };
        const id = data.messages?.[0]?.id ?? `meta-${randomUUID()}`;
        return { providerId: id, status: "SENT" };
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
