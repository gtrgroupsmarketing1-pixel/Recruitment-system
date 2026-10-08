import { db } from "@/core/db/client";
import type { NotificationChannel } from "@prisma/client";

export type ResolvedChannel = {
  channel: NotificationChannel;
  address: string;
  reason: string;
};

export async function resolveChannel(
  tenantId: string,
  recipient: { candidateId?: string; userId?: string }
): Promise<ResolvedChannel | null> {
  if (recipient.candidateId) {
    const candidate = await db.candidate.findFirst({
      where: { tenantId, id: recipient.candidateId, deletedAt: null },
      select: {
        phone: true,
        email: true,
        smsOptIn: true,
        whatsappOptIn: true,
      },
    });
    if (!candidate) return null;

    if (candidate.phone && candidate.whatsappOptIn) {
      return {
        channel: "WHATSAPP",
        address: candidate.phone,
        reason: "whatsapp_opt_in",
      };
    }
    if (candidate.phone && candidate.smsOptIn) {
      return {
        channel: "SMS",
        address: candidate.phone,
        reason: "sms_opt_in",
      };
    }
    if (candidate.email) {
      return {
        channel: "EMAIL",
        address: candidate.email,
        reason: "email_only",
      };
    }
    return null;
  }

  if (recipient.userId) {
    const user = await db.user.findFirst({
      where: { tenantId, id: recipient.userId, deletedAt: null },
      select: { email: true },
    });
    if (!user?.email) return null;
    return { channel: "EMAIL", address: user.email, reason: "staff_default" };
  }

  return null;
}
