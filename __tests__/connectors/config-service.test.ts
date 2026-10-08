import { describe, it, expect } from "vitest";
import { withTenant } from "@/core/db/client";
import { ConnectorConfigService } from "@/modules/connector/connector.config.service";
import { seedTenantWithCase } from "../helpers/seed";

const hasDb = Boolean(process.env.DATABASE_URL && process.env.AUTH_DATABASE_URL);

describe.skipIf(!hasDb)("ConnectorConfigService", () => {
  it("upsert stores credentials and view hides them", async () => {
    const seed = await seedTenantWithCase();
    const view = await withTenant(seed.tenantId, () =>
      ConnectorConfigService.upsert(seed.tenantId, seed.adminId, "WAFID", {
        isEnabled: true,
        credentials: { username: "u1", password: "secret" },
        pollingIntervalMinutes: 30,
      })
    );

    expect(view.isEnabled).toBe(true);
    expect(view.hasCredentials).toBe(true);
    expect(view).not.toHaveProperty("credentialsCt");
    expect(JSON.stringify(view)).not.toContain("secret");
  });
});
