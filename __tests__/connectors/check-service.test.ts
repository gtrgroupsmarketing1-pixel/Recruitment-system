import { describe, it, expect } from "vitest";
import { withTenant } from "@/core/db/client";
import { ConnectorConfigService } from "@/modules/connector/connector.config.service";
import { ConnectorCheckService } from "@/modules/connector/connector.check.service";
import { seedTenantWithCase } from "../helpers/seed";

const hasDb = Boolean(process.env.DATABASE_URL && process.env.AUTH_DATABASE_URL);

describe.skipIf(!hasDb)("ConnectorCheckService", () => {
  it("startTracking rejects disabled connector", async () => {
    const seed = await seedTenantWithCase();
    const checklistId = seed.checklistIds[0];
    await expect(
      withTenant(seed.tenantId, () =>
        ConnectorCheckService.startTracking(
          seed.tenantId,
          seed.officerId,
          checklistId,
          "1234567890"
        )
      )
    ).rejects.toThrow(/not enabled/i);
  });

  it("startTracking succeeds when connector enabled", async () => {
    const seed = await seedTenantWithCase();
    await withTenant(seed.tenantId, () =>
      ConnectorConfigService.upsert(seed.tenantId, seed.adminId, "WAFID", {
        isEnabled: true,
        credentials: { username: "u", password: "p" },
      })
    );
    const checklistId = seed.checklistIds[0];
    const check = await withTenant(seed.tenantId, () =>
      ConnectorCheckService.startTracking(
        seed.tenantId,
        seed.officerId,
        checklistId,
        "1234567890"
      )
    );
    expect(check.lastStatus).toBe("PENDING");
    expect(check.trackingId).toBe("1234567890");
  });
});
