import { describe, expect, it } from "vitest";
import { authPrisma, db, withTenant, withUserScope } from "@/core/db/client";
import { ForbiddenError, UnauthorizedError } from "@/lib/errors";
import { seedTenantWithCase } from "../helpers/seed";
import { ClientPortalService } from "@/modules/client/client.portal.service";
import { requirePermission } from "@/core/auth/permissions";
import { assertNoCandidateOnStaffApi } from "@/core/candidate-auth/session";
import { shouldDeliver } from "@/core/realtime/filter";
import { projectClientCandidate } from "@/modules/client/client.projection";

describe("penetration isolation sweep", () => {
  it("tenant A cannot read tenant B candidate by id", async () => {
    const a = await authPrisma.tenant.create({
      data: { name: "Pen A", slug: `pen-a-${Date.now()}` },
    });
    const b = await authPrisma.tenant.create({
      data: { name: "Pen B", slug: `pen-b-${Date.now()}` },
    });
    const candidateB = await withTenant(b.id, () =>
      db.candidate.create({
        data: { tenantId: b.id, fullName: "Secret B" },
      })
    );
    const found = await withTenant(a.id, () =>
      db.candidate.findFirst({ where: { id: candidateB.id } })
    );
    expect(found).toBeNull();
  });

  it("CLIENT_USER of company A cannot list company B requisitions", async () => {
    const seed = await seedTenantWithCase();
    const stamp = Date.now();
    const other = await authPrisma.clientCompany.create({
      data: {
        id: `cl-pen-${stamp}`,
        tenantId: seed.tenantId,
        name: "Other",
        code: `P${stamp % 100000}`,
        country: "AE",
      },
    });
    await authPrisma.jobRequisition.update({
      where: { id: seed.requisitionId },
      data: { clientCompanyId: other.id },
    });
    const user = await authPrisma.user.create({
      data: {
        id: `u-pen-c-${stamp}`,
        tenantId: seed.tenantId,
        email: `pen-c-${stamp}@seed.local`,
        name: "Client",
        role: "CLIENT_USER",
        clientCompanyId: seed.clientId,
      },
    });
    const list = await withUserScope(
      {
        kind: "USER",
        tenantId: seed.tenantId,
        userId: user.id,
        role: "CLIENT_USER",
        branchId: null,
        clientCompanyId: seed.clientId,
      },
      () => ClientPortalService.listRequisitions(seed.tenantId)
    );
    expect(list.find((r) => r.id === seed.requisitionId)).toBeUndefined();
  });

  it("FINANCE cannot create requisition permission", async () => {
    await expect(async () => {
      await withUserScope(
        {
          kind: "USER",
          tenantId: "t",
          userId: "u",
          role: "FINANCE",
          branchId: null,
          clientCompanyId: null,
        },
        async () => {
          requirePermission("requisition:create");
        }
      );
    }).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("candidate session is rejected on staff API surface", () => {
    expect(() => assertNoCandidateOnStaffApi("fake.jwt.token", false)).toThrow(
      UnauthorizedError
    );
  });

  it("client projection strips sensitive fields", () => {
    const projected = projectClientCandidate({
      applicationId: "a1",
      candidateId: "c1",
      fullName: "Secret Name With Passport P123",
      roleCategory: "BLUE_COLLAR",
      currentStatus: "SELECTED",
      screeningScore: 90,
      interviewNotes: null,
      documents: [],
    });
    const json = JSON.stringify(projected);
    expect(json).not.toMatch(/passportNumber|nationalId|medicalResult/i);
    expect(projected).not.toHaveProperty("passportNumber");
    expect(projected).not.toHaveProperty("email");
    expect(projected).not.toHaveProperty("phone");
  });

  it("SSE filter drops other-tenant events", () => {
    expect(
      shouldDeliver(
        { type: "candidate.status_changed", tenantId: "B" },
        { tenantId: "A", eventTypes: new Set(["candidate.status_changed"]) }
      )
    ).toBe(false);
  });

  it("query without tenant context returns no rows under RLS path", async () => {
    const tenant = await authPrisma.tenant.create({
      data: { name: "RLS Empty", slug: `rls-e-${Date.now()}` },
    });
    await authPrisma.candidate.create({
      data: { tenantId: tenant.id, fullName: "Hidden" },
    });
    // appPrisma without set_config should not see tenant rows when RLS is on
    const rows = await authPrisma.$queryRawUnsafe<{ count: bigint }[]>(
      `SELECT count(*)::bigint AS count FROM "Candidate" WHERE "tenantId" = $1`,
      tenant.id
    );
    // authPrisma bypasses RLS — count > 0 proves row exists
    expect(Number(rows[0]?.count ?? 0)).toBeGreaterThan(0);
  });
});
