import { randomUUID } from "node:crypto";
import { logger } from "@/lib/logger";
import type {
  NotificationChannelDriver,
  SendInput,
  SendResult,
} from "@/core/notifications/channel";
import { CHANNEL_TIMEOUT_MS } from "@/core/notifications/channel";

/** Dev/CI driver — no external call. */
export const LogSmsChannel: NotificationChannelDriver = {
  async send(input: SendInput): Promise<SendResult> {
    const providerId = `log-sms-${randomUUID()}`;
    logger.info(
      { channel: "SMS", providerId, toPresent: Boolean(input.to) },
      "sms sent via log driver"
    );
    return { providerId, status: "SENT" };
  },
};

/** Twilio Messages API via fetch (no SDK). */
export function createTwilioSmsChannel(
  accountSid: string,
  authToken: string,
  fromNumber: string
): NotificationChannelDriver {
  return {
    async send(input: SendInput): Promise<SendResult> {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), CHANNEL_TIMEOUT_MS);
      const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
      const params = new URLSearchParams({
        To: input.to,
        From: fromNumber,
        Body: input.body,
      });
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: params,
          signal: controller.signal,
        });
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          return {
            providerId: "",
            status: "FAILED",
            errorMessage: text.slice(0, 500),
          };
        }
        const json = (await res.json()) as { sid?: string };
        return { providerId: json.sid ?? "", status: "SENT" };
      } catch (err) {
        return {
          providerId: "",
          status: "FAILED",
          errorMessage: err instanceof Error ? err.message : "sms_failed",
        };
      } finally {
        clearTimeout(timer);
      }
    },
  };
}
