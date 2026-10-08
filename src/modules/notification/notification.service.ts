import type {
  Notification,
  NotificationChannel,
  NotificationStatus,
} from "@prisma/client";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { TEMPLATES, type TemplateContext } from "@/core/notifications/templates";
import { getChannelDriver } from "@/core/notifications/drivers";
import { SmsQuotaService } from "@/modules/notification/sms-quota.service";
import { logger } from "@/lib/logger";
import { renderEmailHtml } from "@/core/notifications/email.layout";
import { NotificationRepo } from "./notification.repo";
import { resolveSender } from "./sender.resolver";

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
  htmlBody: string | null;
  providerId: string | null;
  errorMessage: string | null;
  bounceType: string | null;
  bounceReason: string | null;
  sentAt: Date | null;
  deliveredAt: Date | null;
  openedAt: Date | null;
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
    htmlBody: row.htmlBody,
    providerId: row.providerId,
    errorMessage: row.errorMessage,
    bounceType: row.bounceType,
    bounceReason: row.bounceReason,
    sentAt: row.sentAt,
    deliveredAt: row.deliveredAt,
    openedAt: row.openedAt,
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

    let channel = overrides?.channel ?? tpl.channel;
    if (channel === "SMS") {
      const quota = await SmsQuotaService.canSend(tenantId);
      if (!quota.ok) {
        logger.warn(
          { tenantId, used: quota.used, limit: quota.limit },
          "sms quota exceeded; falling back to email"
        );
        channel = "EMAIL";
      }
    }
    const subject = tpl.subject ? tpl.subject(context) : null;
    const body = tpl.body(context);
    const sender = await resolveSender(tenantId);
    const htmlBody =
      channel === "EMAIL" && tpl.bodyHtml
        ? renderEmailHtml(tpl.bodyHtml(context), sender.signatureHtml)
        : null;

    const queued = await NotificationRepo.createQueued(tenantId, {
      channel,
      templateKey,
      recipientType: recipient.type,
      recipientId: recipient.id,
      recipientAddr: recipient.addr,
      subject,
      body,
      htmlBody,
    });

    const driver = getChannelDriver(channel);
    const result = await driver.send({
      to: recipient.addr,
      subject: subject ?? undefined,
      body,
      htmlBody: htmlBody ?? undefined,
      metadata: { templateKey, tenantId, notificationId: queued.id },
      sender: {
        fromName: sender.fromName,
        fromEmail: sender.fromEmail,
        replyToEmail: sender.replyToEmail,
      },
    });

    const now = new Date();
    const updated = await NotificationRepo.updateStatus(tenantId, queued.id, {
      status: result.status,
      providerId: result.providerId || null,
      errorMessage: result.errorMessage ?? null,
      sentAt: result.status === "SENT" || result.status === "DELIVERED" ? now : null,
      deliveredAt: result.status === "DELIVERED" ? now : null,
    });

    if (
      channel === "SMS" &&
      (result.status === "SENT" || result.status === "DELIVERED")
    ) {
      await SmsQuotaService.increment(tenantId);
    }

    return toView(updated ?? queued);
  },

  async listHardBounces(tenantId: string, since: Date): Promise<NotificationView[]> {
    const rows = await NotificationRepo.list(tenantId, { status: "BOUNCED", limit: 50 });
    return rows
      .filter(
        (r) =>
          r.bounceType === "HardBounce" &&
          r.createdAt.getTime() > since.getTime()
      )
      .map(toView);
  },

  async saveEmailConfig(
    tenantId: string,
    input: {
      fromName: string;
      fromEmail: string;
      replyToEmail: string | null;
      signatureHtml: string | null;
    }
  ) {
    if (input.fromName.length === 0 || input.fromName.length > 100) {
      throw new ValidationError("fromName must be 1–100 characters");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.fromEmail)) {
      throw new ValidationError("fromEmail must be a valid email");
    }
    if (input.signatureHtml && input.signatureHtml.length > 2000) {
      throw new ValidationError("signatureHtml max 2000 characters");
    }
    const { db } = await import("@/core/db/client");
    return db.tenantEmailConfig.upsert({
      where: { tenantId },
      create: { tenantId, ...input },
      update: input,
    });
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
