import { randomUUID } from "node:crypto";
import type {
  NotificationChannelDriver,
  SendInput,
  SendResult,
} from "@/core/notifications/channel";

/**
 * In-app channel: no external call. The Notification row itself is the delivery.
 * Service marks DELIVERED after this returns.
 */
export const InAppChannel: NotificationChannelDriver = {
  async send(_input: SendInput): Promise<SendResult> {
    return {
      providerId: `inapp-${randomUUID()}`,
      status: "DELIVERED",
    };
  },
};
