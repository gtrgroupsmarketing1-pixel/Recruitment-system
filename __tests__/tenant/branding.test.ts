import { describe, expect, it } from "vitest";
import { authPrisma } from "@/core/db/client";
import { ForbiddenError } from "@/lib/errors";
import { BrandingService } from "@/modules/tenant/branding.service";

describe("branding", () => {
  it("writes columns for tenant admin and rejects other roles", async () => {
    const stamp = Date.now();
    const tenant = await authPrisma.tenant.create({
      data: { id: `t-br-${stamp}`, name: "Br", slug: `br-${stamp}` },
    });
    await BrandingService.update(tenant.id, "TENANT_ADMIN", {
      displayName: "Acme Manpower",
      primaryColor: "#0F62FE",
      defaultLocale: "ar",
    });
    const row = await authPrisma.tenant.findFirst({ where: { id: tenant.id } });
    expect(row?.displayName).toBe("Acme Manpower");
    expect(row?.defaultDirection).toBe("rtl");
    await expect(
      BrandingService.update(tenant.id, "RECRUITER", { displayName: "Nope" })
    ).rejects.toBeInstanceOf(ForbiddenError);
    const uploaded = await BrandingService.uploadLogo(tenant.id, "TENANT_ADMIN", "logo.png", "image/png");
    expect(uploaded.key).toContain(tenant.id);
    expect(uploaded.uploadUrl).toBeTruthy();
  });
});
