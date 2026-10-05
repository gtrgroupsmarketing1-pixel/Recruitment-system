import { describe, it, expect } from "vitest";
import { getTenantId, runWithTenant } from "@/core/db/tenant-context";

describe("tenant context", () => {
  it("propagates tenantId inside runWithTenant and throws outside", async () => {
    expect(() => getTenantId()).toThrow(/No tenant context/);
    const seen = await runWithTenant("ten_9", async () => getTenantId());
    expect(seen).toBe("ten_9");
    expect(() => getTenantId()).toThrow(/No tenant context/);
  });
});
