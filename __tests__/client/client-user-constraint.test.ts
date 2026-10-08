import { describe, expect, it } from "vitest";
import { authPrisma } from "@/core/db/client";

async function expectCheckViolation(sql: Promise<unknown>) {
  await expect(sql).rejects.toThrow(/user_scope_exclusive|23514/);
}

describe("user scope check constraint", () => {
  it("rejects CLIENT_USER without company, CLIENT_USER with branch, and staff with company", async () => {
    const stamp = Date.now();
    const tenant = await authPrisma.tenant.create({
      data: { id: `t-ck-${stamp}`, name: "CK", slug: `ck-${stamp}` },
    });
    const branch = await authPrisma.branch.create({
      data: { id: `br-ck-${stamp}`, tenantId: tenant.id, name: "HQ" },
    });
    const company = await authPrisma.clientCompany.create({
      data: { id: `cl-ck-${stamp}`, tenantId: tenant.id, name: "Co", code: `K${stamp % 100000}` },
    });

    await expectCheckViolation(
      authPrisma.$executeRaw`
        INSERT INTO "User" (id, "tenantId", email, name, role, "updatedAt")
        VALUES (${`u-ck1-${stamp}`}, ${tenant.id}, ${`ck1-${stamp}@t.local`}, 'N', 'CLIENT_USER'::"UserRole", NOW())
      `
    );
    await expectCheckViolation(
      authPrisma.$executeRaw`
        INSERT INTO "User" (id, "tenantId", email, name, role, "branchId", "clientCompanyId", "updatedAt")
        VALUES (${`u-ck2-${stamp}`}, ${tenant.id}, ${`ck2-${stamp}@t.local`}, 'N', 'CLIENT_USER'::"UserRole", ${branch.id}, ${company.id}, NOW())
      `
    );
    await expectCheckViolation(
      authPrisma.$executeRaw`
        INSERT INTO "User" (id, "tenantId", email, name, role, "clientCompanyId", "updatedAt")
        VALUES (${`u-ck3-${stamp}`}, ${tenant.id}, ${`ck3-${stamp}@t.local`}, 'N', 'RECRUITER'::"UserRole", ${company.id}, NOW())
      `
    );
  });
});
