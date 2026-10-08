import { describe, expect, it } from "vitest";
import { authPrisma } from "@/core/db/client";
import { resolveTenantFromHost } from "@/core/tenant/resolver";

describe("tenant resolver", () => {
  it("resolves slug and custom domain, and ignores unknown or deleted", async () => {
    const stamp = Date.now();
    process.env.ROOT_DOMAIN = "example.com";
    const tenant = await authPrisma.tenant.create({
      data: {
        id: `t-res-${stamp}`,
        name: "Res",
        slug: `res-${stamp}`,
        customDomain: `recruit-${stamp}.example.net`,
      },
    });
    await authPrisma.tenant.create({
      data: { id: `t-del-${stamp}`, name: "Del", slug: `del-${stamp}`, deletedAt: new Date() },
    });
    expect((await resolveTenantFromHost(`res-${stamp}.example.com`))?.id).toBe(tenant.id);
    expect(await resolveTenantFromHost(`missing-${stamp}.example.com`)).toBeNull();
    expect(await resolveTenantFromHost(`del-${stamp}.example.com`)).toBeNull();
    expect((await resolveTenantFromHost(`recruit-${stamp}.example.net`))?.id).toBe(tenant.id);
  });
});
