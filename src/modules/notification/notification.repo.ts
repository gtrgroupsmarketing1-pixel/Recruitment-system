import type {
  Notification,
  NotificationChannel,
  NotificationStatus,
  Prisma,
} from "@prisma/client";
import { db } from "@/core/db/client";

export type NotificationCreateInput = Omit<
  Prisma.NotificationUncheckedCreateInput,
  "tenantId"
>;

export type NotificationListFilter = {
  status?: NotificationStatus;
  templateKey?: string;
  recipientId?: string;
  limit?: number;
};

export const NotificationRepo = {
  async create(
    tenantId: string,
    data: NotificationCreateInput
  ): Promise<Notification> {
    return db.notification.create({
      data: { ...data, tenantId },
    });
  },

  async updateStatus(
    tenantId: string,
    id: string,
    data: {
      status: NotificationStatus;
      providerId?: string | null;
      errorMessage?: string | null;
      sentAt?: Date | null;
      deliveredAt?: Date | null;
    }
  ): Promise<Notification | null> {
    const result = await db.notification.updateMany({
      where: { id, tenantId },
      data,
    });
    if (result.count === 0) return null;
    return db.notification.findFirst({
      where: { id, tenantId },
    });
  },

  async findById(
    tenantId: string,
    id: string
  ): Promise<Notification | null> {
    return db.notification.findFirst({
      where: { id, tenantId },
    });
  },

  async list(
    tenantId: string,
    filter: NotificationListFilter = {}
  ): Promise<Notification[]> {
    const limit = filter.limit ?? 200;
    return db.notification.findMany({
      where: {
        tenantId,
        ...(filter.status ? { status: filter.status } : {}),
        ...(filter.templateKey ? { templateKey: filter.templateKey } : {}),
        ...(filter.recipientId ? { recipientId: filter.recipientId } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  },

  async createQueued(
    tenantId: string,
    input: {
      channel: NotificationChannel;
      templateKey: string;
      recipientType: string;
      recipientId: string | null;
      recipientAddr: string;
      subject: string | null;
      body: string;
    }
  ): Promise<Notification> {
    return NotificationRepo.create(tenantId, {
      channel: input.channel,
      status: "QUEUED",
      templateKey: input.templateKey,
      recipientType: input.recipientType,
      recipientId: input.recipientId,
      recipientAddr: input.recipientAddr,
      subject: input.subject,
      body: input.body,
    });
  },
};
