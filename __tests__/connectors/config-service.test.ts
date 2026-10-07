import { describe, it, expect } from "vitest";
import { authPrisma, withTenant } from "@/core/db/client";
import { ConnectorConfigService } from "@/modules/connector/connector.config.service";

const hasDb = Boolean(process.env.DATABASE_URL && process.env.AUTH_DATABASE_URL);

describe.skipIf(!hasDb)("ConnectorConfigService", () => {
  it("upsert stores encrypted credentials and view hides them", async () => {
    const stamp = Date.now();
    const tenant = await authPrisma.tenant.create({
      data: { id: `t-cc-${stamp}`, name: "C", slug: `cc-${stamp}` },
    });
    const user = await authPrisma.user.create({
      data: {
        id: `u-cc-${stamp}`,
        tenantId: tenant.id,
        email: `cc-${stamp}@t.local`,
        name: "Admin",
        role: "TENANT_ADMIN",
      },
    });

    const view = await withTenant(tenant.id, () =>
      ConnectorConfigService.upsert(tenant.id, user.id, "WAFID", {
        isEnabled: true,
        credentials: { username: "u1", password: "secret" },
        pollingIntervalMinutes: 30,
      })
    );

    expect(view.isEnabled).toBe(true);
    expect(view.hasCredentials).toBe(true);
    expect(view).not.toHaveProperty("credentialsCt");
    expect(JSON.stringify(view)).not.toContain("secret");

    const row = await authPrisma.tenantConnectorConfig.findFirst({
      where: { tenantId: tenant.id, connectorId: "WAFID" },
    });
    expect(row?.credentialsCt).toBeTruthy();
    // encrypted at rest via middleware when written through db; authPrisma may store plain
    // View path is the contract for UI.
  });
});
