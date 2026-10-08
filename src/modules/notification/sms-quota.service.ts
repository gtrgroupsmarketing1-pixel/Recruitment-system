import { db } from "@/core/db/client";

function todayKey(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

function limit(): number {
  return Number(process.env.SMS_DAILY_LIMIT_PER_TENANT ?? 500);
}

export const SmsQuotaService = {
  async canSend(
    tenantId: string
  ): Promise<{ ok: boolean; used: number; limit: number }> {
    const day = todayKey();
    const row = await db.tenantSmsQuota.findFirst({
      where: { tenantId, day },
    });
    const used = row?.sentCount ?? 0;
    const lim = limit();
    return { ok: used < lim, used, limit: lim };
  },

  async increment(tenantId: string): Promise<void> {
    const day = todayKey();
    const existing = await db.tenantSmsQuota.findFirst({
      where: { tenantId, day },
    });
    if (existing) {
      await db.tenantSmsQuota.update({
        where: { id: existing.id },
        data: { sentCount: { increment: 1 } },
      });
      return;
    }
    await db.tenantSmsQuota.create({
      data: { tenantId, day, sentCount: 1 },
    });
  },

  async getUsage(
    tenantId: string
  ): Promise<{ used: number; limit: number; day: string }> {
    const day = todayKey();
    const row = await db.tenantSmsQuota.findFirst({
      where: { tenantId, day },
    });
    return { used: row?.sentCount ?? 0, limit: limit(), day };
  },
};
