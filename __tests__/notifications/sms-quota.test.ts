import { describe, it, expect } from "vitest";
import { authPrisma, withTenant } from "@/core/db/client";
import { SmsQuotaService } from "@/modules/notification/sms-quota.service";

const hasDb = Boolean(process.env.DATABASE_URL && process.env.AUTH_DATABASE_URL);

describe.skipIf(!hasDb)("SmsQuotaService", () => {
  it("increments and enforces daily limit", async () => {
    const stamp = Date.now();
    const tenant = await authPrisma.tenant.create({
      data: { id: `t-sq-${stamp}`, name: "Q", slug: `sq-${stamp}` },
    });
    process.env.SMS_DAILY_LIMIT_PER_TENANT = "2";

    await withTenant(tenant.id, async () => {
      const first = await SmsQuotaService.canSend(tenant.id);
      expect(first.ok).toBe(true);
      await SmsQuotaService.increment(tenant.id);
      await SmsQuotaService.increment(tenant.id);
      const after = await SmsQuotaService.canSend(tenant.id);
      expect(after.ok).toBe(false);
      expect(after.used).toBe(2);
    });
  });
});
