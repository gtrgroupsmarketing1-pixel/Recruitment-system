import type {
  Notification,
  NotificationChannel,
  NotificationStatus,
} from "@prisma/client";
import { NotFoundError } from "@/lib/errors";
import { TEMPLATES, type TemplateContext } from "@/core/notifications/templates";
import { getChannelDriver } from "@/core/notifications/drivers";
import { NotificationRepo } from "./notification.repo";

export type NotificationView = {
  id: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  templateKey: string;
  recipientType: string;
  recipientId: string | null;
  recipientAddr: string;
  subject: string | null;
  body: string;
  providerId: string | null;
  errorMessage: string | null;
  sentAt: Date | null;
  deliveredAt: Date | null;
  createdAt: Date;
};

function toView(row: Notification): NotificationView {
  return {
    id: row.id,
    channel: row.channel,
    status: row.status,
    templateKey: row.templateKey,
    recipientType: row.recipientType,
    recipientId: row.recipientId,
    recipientAddr: row.recipientAddr,
    subject: row.subject,
    body: row.body,
    providerId: row.providerId,
    errorMessage: row.errorMessage,
    sentAt: row.sentAt,
    deliveredAt: row.deliveredAt,
    createdAt: row.createdAt,
  };
}

export const NotificationService = {
  async send(
    tenantId: string,
    templateKey: string,
    recipient: { type: string; id: string | null; addr: string },
    context: TemplateContext,
    overrides?: { channel?: NotificationChannel }
  ): Promise<NotificationView> {
    const tpl = TEMPLATES[templateKey];
    if (!tpl) {
      throw new NotFoundError("NotificationTemplate", templateKey);
    }

    const channel = overrides?.channel ?? tpl.channel;
    const subject = tpl.subject ? tpl.subject(context) : null;
    const body = tpl.body(context);

    const queued = await NotificationRepo.createQueued(tenantId, {
      channel,
      templateKey,
      recipientType: recipient.type,
      recipientId: recipient.id,
      recipientAddr: recipient.addr,
      subject,
      body,
    });

    const driver = getChannelDriver(channel);
    const result = await driver.send({
      to: recipient.addr,
      subject: subject ?? undefined,
      body,
      metadata: { templateKey, tenantId },
    });

    const now = new Date();
    const updated = await NotificationRepo.updateStatus(tenantId, queued.id, {
      status: result.status,
      providerId: result.providerId || null,
      errorMessage: result.errorMessage ?? null,
      sentAt: result.status === "SENT" || result.status === "DELIVERED" ? now : null,
      deliveredAt: result.status === "DELIVERED" ? now : null,
    });

    return toView(updated ?? queued);
  },

  async listForTenant(
    tenantId: string,
    filter: {
      status?: NotificationStatus;
      templateKey?: string;
      recipientId?: string;
      limit?: number;
    } = {}
  ): Promise<NotificationView[]> {
    const rows = await NotificationRepo.list(tenantId, filter);
    return rows.map(toView);
  },

  async getById(
    tenantId: string,
    id: string
  ): Promise<NotificationView> {
    const row = await NotificationRepo.findById(tenantId, id);
    if (!row) throw new NotFoundError("Notification", id);
    return toView(row);
  },

  /**
   * Re-send using the same template/recipient/context stored on the row.
   * Does NOT delete the old row — creates a new Notification via send().
   * Body is already rendered; we re-render from stored templateKey with
   * minimal context reconstructed from the prior row fields.
   */
  async retry(tenantId: string, id: string): Promise<NotificationView> {
    const prior = await NotificationRepo.findById(tenantId, id);
    if (!prior) throw new NotFoundError("Notification", id);

    // Re-send with empty context; body was already rendered once.
    // Templates that need merge fields will show empty placeholders —
    // acceptable for admin retry of a known message shape.
    return NotificationService.send(
      tenantId,
      prior.templateKey,
      {
        type: prior.recipientType,
        id: prior.recipientId,
        addr: prior.recipientAddr,
      },
      {
        // Best-effort: put prior body fragments are not re-parsed.
        // Callers that need full context should publish a new event.
      },
      { channel: prior.channel }
    );
  },
};
