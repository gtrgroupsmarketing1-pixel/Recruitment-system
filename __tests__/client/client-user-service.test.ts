import { describe, expect, it } from "vitest";
import { authPrisma } from "@/core/db/client";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { ClientUserService } from "@/modules/client/client.user.service";

describe("client user service", () => {
  it("creates, rejects duplicates and foreign companies, and toggles deletedAt", async () => {
    const stamp = Date.now();
    const tenant = await authPrisma.tenant.create({
      data: { id: `t-cu-${stamp}`, name: "CU", slug: `cu-${stamp}` },
    });
    const other = await authPrisma.tenant.create({
      data: { id: `t-cu2-${stamp}`, name: "CU2", slug: `cu2-${stamp}` },
    });
    const company = await authPrisma.clientCompany.create({
      data: { id: `cl-cu-${stamp}`, tenantId: tenant.id, name: "Co", code: `C${stamp % 100000}` },
    });
    const foreign = await authPrisma.clientCompany.create({
      data: { id: `cl-cu-f-${stamp}`, tenantId: other.id, name: "F", code: `F${stamp % 100000}` },
    });

    const created = await ClientUserService.create(tenant.id, "actor", {
      clientCompanyId: company.id,
      email: `User-${stamp}@Seed.Local`,
      name: "Client User",
      password: "long-password-1",
    });
    expect(created.email).toBe(`user-${stamp}@seed.local`);
    expect(created.clientCompanyId).toBe(company.id);
    expect(created.isActive).toBe(true);
    expect("passwordHash" in created).toBe(false);

    const row = await authPrisma.user.findFirst({ where: { id: created.id, tenantId: tenant.id } });
    expect(row?.role).toBe("CLIENT_USER");
    expect(row?.passwordHash).toBeTruthy();

    await expect(
      ClientUserService.create(tenant.id, "actor", {
        clientCompanyId: company.id,
        email: created.email,
        name: "Dup",
        password: "long-password-1",
      })
    ).rejects.toBeInstanceOf(ValidationError);

    await expect(
      ClientUserService.create(tenant.id, "actor", {
        clientCompanyId: foreign.id,
        email: `other-${stamp}@seed.local`,
        name: "Other",
        password: "long-password-1",
      })
    ).rejects.toBeInstanceOf(NotFoundError);

    await expect(
      ClientUserService.create(tenant.id, "actor", {
        clientCompanyId: company.id,
        email: `admin-${stamp}@seed.local`,
        name: "Nope",
        password: "long-password-1",
        role: "TENANT_ADMIN",
      })
    ).rejects.toBeInstanceOf(ValidationError);

    await ClientUserService.deactivate(tenant.id, "actor", created.id);
    const gone = await authPrisma.user.findFirst({ where: { id: created.id } });
    expect(gone?.deletedAt).toBeTruthy();
    await ClientUserService.reactivate(tenant.id, "actor", created.id);
    const back = await authPrisma.user.findFirst({ where: { id: created.id } });
    expect(back?.deletedAt).toBeNull();
  });
});
