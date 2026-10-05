/**
 * Mandatory cross-tenant isolation suite.
 * This test joins green permanently from Session 05.
 * If DATABASE_URL / AUTH_DATABASE_URL are unset, the suite fails (not skipped).
 */
import { describe, it, expect, beforeAll } from "vitest";
import { db, authPrisma, appPrisma, withTenant } from "@/core/db/client";

const hasDb =
  Boolean(process.env.DATABASE_URL) && Boolean(process.env.AUTH_DATABASE_URL);

describe("cross-tenant isolation (mandatory)", () => {
  beforeAll(() => {
    if (!hasDb) {
      throw new Error(
        "DATABASE_URL and AUTH_DATABASE_URL are required for Session 05 isolation tests. Session blocked."
      );
    }
  });

  it("Tenant A cannot read Tenant B's candidate", async () => {
    const tenantA = await authPrisma.tenant.create({
      data: { name: "A", slug: `a-${Date.now()}` },
    });
    const tenantB = await authPrisma.tenant.create({
      data: { name: "B", slug: `b-${Date.now()}` },
    });

    const candidateB = await withTenant(tenantB.id, () =>
      db.candidate.create({
        data: {
          tenantId: tenantB.id,
          fullName: "B Candidate",
        },
      })
    );

    const found = await withTenant(tenantA.id, () =>
      db.candidate.findFirst({ where: { id: candidateB.id } })
    );
    expect(found).toBeNull();
  });

  it("Tenant A cannot update Tenant B's candidate (count 0)", async () => {
    const tenantA = await authPrisma.tenant.create({
      data: { name: "A2", slug: `a2-${Date.now()}` },
    });
    const tenantB = await authPrisma.tenant.create({
      data: { name: "B2", slug: `b2-${Date.now()}` },
    });
    const candidateB = await withTenant(tenantB.id, () =>
      db.candidate.create({
        data: { tenantId: tenantB.id, fullName: "B2" },
      })
    );

    const result = await withTenant(tenantA.id, () =>
      db.candidate.updateMany({
        where: { id: candidateB.id },
        data: { fullName: "Hacked" },
      })
    );
    expect(result.count).toBe(0);
  });

  it("Tenant A cannot delete Tenant B's candidate (count 0)", async () => {
    const tenantA = await authPrisma.tenant.create({
      data: { name: "A3", slug: `a3-${Date.now()}` },
    });
    const tenantB = await authPrisma.tenant.create({
      data: { name: "B3", slug: `b3-${Date.now()}` },
    });
    const candidateB = await withTenant(tenantB.id, () =>
      db.candidate.create({
        data: { tenantId: tenantB.id, fullName: "B3" },
      })
    );

    const result = await withTenant(tenantA.id, () =>
      db.candidate.deleteMany({ where: { id: candidateB.id } })
    );
    expect(result.count).toBe(0);
  });

  it("app role without set_config returns zero rows (RLS at DB layer)", async () => {
    const rows = await appPrisma.candidate.findMany({ take: 5 });
    expect(Array.isArray(rows)).toBe(true);
    expect(rows.length).toBe(0);
  });

  it("sensitive filter rewrite works under withTenant and stays tenant-scoped", async () => {
    const tenantA = await authPrisma.tenant.create({
      data: { name: "A4", slug: `a4-${Date.now()}` },
    });
    const tenantB = await authPrisma.tenant.create({
      data: { name: "B4", slug: `b4-${Date.now()}` },
    });

    await withTenant(tenantA.id, () =>
      db.candidate.create({
        data: {
          tenantId: tenantA.id,
          fullName: "Passport Holder",
          passportNumber: "AB-123456",
        },
      })
    );

    const hit = await withTenant(tenantA.id, () =>
      db.candidate.findFirst({
        where: { passportNumber: "ab123456" },
      })
    );
    expect(hit?.fullName).toBe("Passport Holder");
    expect(hit?.passportNumber).toBe("AB-123456");

    const miss = await withTenant(tenantB.id, () =>
      db.candidate.findFirst({
        where: { passportNumber: "ab123456" },
      })
    );
    expect(miss).toBeNull();
  });
});
