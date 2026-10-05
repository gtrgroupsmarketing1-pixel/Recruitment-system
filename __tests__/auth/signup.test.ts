import { describe, it, expect } from "vitest";
import { TenantService } from "@/modules/tenant/tenant.service";
import { ValidationError } from "@/lib/errors";

const hasDb = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDb)("signup", () => {
  it("creates a tenant and TENANT_ADMIN, and surfaces slug conflicts", async () => {
    const slug = `agency-${Date.now()}`;
    const created = await TenantService.signup({
      tenantName: "Ada Agency",
      slug,
      adminEmail: `${slug}@agency.test`,
      adminName: "Ada",
      password: "password123",
    });
    expect(created.user.role).toBe("TENANT_ADMIN");
    expect(created.tenant.slug).toBe(slug);
    await expect(
      TenantService.signup({
        tenantName: "Other",
        slug,
        adminEmail: `other-${slug}@agency.test`,
        adminName: "Bea",
        password: "password123",
      })
    ).rejects.toBeInstanceOf(ValidationError);
  });
});
