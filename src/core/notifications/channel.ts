import type { NotificationStatus } from "@prisma/client";

export type SendInput = {
  to: string;
  subject?: string;
  body: string;
  metadata?: Record<string, string>;
};

export type SendResult = {
  providerId: string;
  status: NotificationStatus;
  errorMessage?: string;
};

export interface NotificationChannelDriver {
  send(input: SendInput): Promise<SendResult>;
}

/** External channel timeout (ms). */
export const CHANNEL_TIMEOUT_MS = 5_000;
