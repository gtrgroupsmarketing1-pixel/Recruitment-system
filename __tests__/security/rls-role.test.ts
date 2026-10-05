/**
 * Confirms app_auth BYPASSRLS vs app_tenant RLS.
 * Throws in beforeAll if URLs missing — Session 05b is not done until green.
 */
import { describe, it, expect, beforeAll } from "vitest";
import { db, authPrisma, withTenant } from "@/core/db/client";

const hasDb =
  Boolean(process.env.DATABASE_URL) && Boolean(process.env.AUTH_DATABASE_URL);

describe("RLS roles (app_auth vs app_tenant)", () => {
  beforeAll(() => {
    if (!hasDb) {
      throw new Error(
        "DATABASE_URL and AUTH_DATABASE_URL required for rls-role tests. Session 05b blocked."
      );
    }
  });

  it("authPrisma can read users across tenants (BYPASSRLS)", async () => {
    const t1 = await authPrisma.tenant.create({
      data: { name: "R1", slug: `r1-${Date.now()}` },
    });
    const t2 = await authPrisma.tenant.create({
      data: { name: "R2", slug: `r2-${Date.now()}` },
    });
    await authPrisma.user.create({
      data: {
        tenantId: t1.id,
        email: `u1-${Date.now()}@test.local`,
        name: "U1",
        role: "RECRUITER",
      },
    });
    await authPrisma.user.create({
      data: {
        tenantId: t2.id,
        email: `u2-${Date.now()}@test.local`,
        name: "U2",
        role: "RECRUITER",
      },
    });

    const all = await authPrisma.user.findMany({
      where: { tenantId: { in: [t1.id, t2.id] } },
    });
    expect(all.length).toBeGreaterThanOrEqual(2);
  });

  it("db inside withTenant(tenantA) sees only tenantA users", async () => {
    const tA = await authPrisma.tenant.create({
      data: { name: "RA", slug: `ra-${Date.now()}` },
    });
    const tB = await authPrisma.tenant.create({
      data: { name: "RB", slug: `rb-${Date.now()}` },
    });
    await authPrisma.user.create({
      data: {
        tenantId: tA.id,
        email: `ra-${Date.now()}@test.local`,
        name: "RA",
        role: "RECRUITER",
      },
    });
    await authPrisma.user.create({
      data: {
        tenantId: tB.id,
        email: `rb-${Date.now()}@test.local`,
        name: "RB",
        role: "RECRUITER",
      },
    });

    const rows = await withTenant(tA.id, () => db.user.findMany());
    expect(rows.every((u) => u.tenantId === tA.id)).toBe(true);
    expect(rows.some((u) => u.tenantId === tB.id)).toBe(false);
  });

  it("db inside withTenant(tenantA) cannot see tenantB users by id", async () => {
    const tA = await authPrisma.tenant.create({
      data: { name: "RA2", slug: `ra2-${Date.now()}` },
    });
    const tB = await authPrisma.tenant.create({
      data: { name: "RB2", slug: `rb2-${Date.now()}` },
    });
    const userB = await authPrisma.user.create({
      data: {
        tenantId: tB.id,
        email: `rb2-${Date.now()}@test.local`,
        name: "RB2",
        role: "RECRUITER",
      },
    });

    const found = await withTenant(tA.id, () =>
      db.user.findFirst({ where: { id: userB.id } })
    );
    expect(found).toBeNull();
  });

  it("db outside withTenant throws in non-production", async () => {
    if (process.env.NODE_ENV === "production") {
      return;
    }
    expect(() => db.user).toThrow(/without tenant context/);
  });
});
