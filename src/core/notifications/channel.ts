import type { NotificationStatus } from "@prisma/client";

export type SendInput = {
  to: string;
  subject?: string;
  body: string;
  htmlBody?: string;
  metadata?: Record<string, string>;
  sender?: {
    fromName: string;
    fromEmail: string;
    replyToEmail: string | null;
  };
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
