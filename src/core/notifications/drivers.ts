import type { NotificationChannel } from "@prisma/client";
import type { NotificationChannelDriver } from "@/core/notifications/channel";
import {
  LogEmailChannel,
  createPostmarkEmailChannel,
} from "@/core/notifications/channels/email.channel";
import {
  LogWhatsAppChannel,
  createMetaWhatsAppChannel,
} from "@/core/notifications/channels/whatsapp.channel";
import { InAppChannel } from "@/core/notifications/channels/in-app.channel";
import { ValidationError } from "@/lib/errors";

export type EmailDriverName = "postmark" | "log";
export type WhatsAppDriverName = "meta" | "log";

/**
 * Resolve channel driver from env. Defaults to log.
 * Boot-time validation (fail if real driver missing credentials) lives in parseNotificationEnv.
 */
export function getChannelDriver(
  channel: NotificationChannel
): NotificationChannelDriver {
  switch (channel) {
    case "EMAIL": {
      const driver = (process.env.EMAIL_DRIVER ?? "log") as EmailDriverName;
      if (driver === "postmark") {
        const token = process.env.POSTMARK_TOKEN;
        if (!token) {
          throw new ValidationError(
            "EMAIL_DRIVER=postmark requires POSTMARK_TOKEN"
          );
        }
        return createPostmarkEmailChannel(token);
      }
      return LogEmailChannel;
    }
    case "WHATSAPP": {
      const driver = (process.env.WHATSAPP_DRIVER ?? "log") as WhatsAppDriverName;
      if (driver === "meta") {
        const token = process.env.META_WHATSAPP_TOKEN;
        const phoneId = process.env.META_WHATSAPP_PHONE_ID;
        if (!token || !phoneId) {
          throw new ValidationError(
            "WHATSAPP_DRIVER=meta requires META_WHATSAPP_TOKEN and META_WHATSAPP_PHONE_ID"
          );
        }
        return createMetaWhatsAppChannel(token, phoneId);
      }
      return LogWhatsAppChannel;
    }
    case "IN_APP":
      return InAppChannel;
    case "SMS":
      // Session 22 — fall back to log
      return LogEmailChannel;
    default:
      return LogEmailChannel;
  }
}
