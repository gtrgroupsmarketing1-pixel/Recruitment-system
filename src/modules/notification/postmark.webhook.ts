/**
 * Postmark inbound webhook. No tenant context — lookup by provider MessageID
 * via authPrisma (BYPASSRLS). Updates are idempotent.
 */
import { authPrisma } from "@/core/db/client";

export type PostmarkRecord = {
  RecordType?: string;
  MessageID?: string;
  DeliveredAt?: string;
  Type?: string;
  Description?: string;
  ReceivedAt?: string;
};

export type WebhookResult =
  | { status: 200; body: "OK" }
  | { status: 401; body: "Unauthorized" }
  | { status: 404; body: "Not found" }
  | { status: 400; body: "Bad request" };

export function expectedBasicAuth(user: string, pass: string): string {
  return `Basic ${Buffer.from(`${user}:${pass}`).toString("base64")}`;
}

export async function handlePostmarkWebhook(
  authorization: string | null,
  payload: PostmarkRecord,
  creds: { user?: string; pass?: string }
): Promise<WebhookResult> {
  if (!creds.user || !creds.pass) {
    return { status: 401, body: "Unauthorized" };
  }
  if (authorization !== expectedBasicAuth(creds.user, creds.pass)) {
    return { status: 401, body: "Unauthorized" };
  }
  if (!payload.MessageID || !payload.RecordType) {
    return { status: 400, body: "Bad request" };
  }

  const notification = await authPrisma.notification.findFirst({
    where: { providerId: payload.MessageID },
  });
  if (!notification) return { status: 404, body: "Not found" };

  switch (payload.RecordType) {
    case "Delivery":
      await authPrisma.notification.update({
        where: { id: notification.id },
        data: {
          status: "DELIVERED",
          deliveredAt: payload.DeliveredAt
            ? new Date(payload.DeliveredAt)
            : new Date(),
        },
      });
      break;
    case "Bounce":
      await authPrisma.notification.update({
        where: { id: notification.id },
        data: {
          status: "BOUNCED",
          bounceType: payload.Type ?? "HardBounce",
          bounceReason: payload.Description ?? null,
        },
      });
      break;
    case "Open":
      await authPrisma.notification.update({
        where: { id: notification.id },
        data: {
          openedAt: payload.ReceivedAt ? new Date(payload.ReceivedAt) : new Date(),
        },
      });
      break;
    default:
      break;
  }
  return { status: 200, body: "OK" };
}
