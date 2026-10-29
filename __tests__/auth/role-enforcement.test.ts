import { describe, expect, it, beforeEach } from "vitest";
import type { UserRole } from "@prisma/client";
import { withUserScope, authPrisma } from "@/core/db/client";
import { requirePermission } from "@/core/auth/permissions";
import { ForbiddenError } from "@/lib/errors";
import { seedTenantWithCase } from "../helpers/seed";
import { CandidateService } from "@/modules/candidate/candidate.service";

async function asRole(
  tenantId: string,
  userId: string,
  role: UserRole,
  branchId: string | null,
  fn: () => Promise<void>
) {
  await withUserScope(
    { kind: "USER", tenantId, userId, role, branchId, clientCompanyId: null },
    fn
  );
}

describe("role enforcement", () => {
  let seed: Awaited<ReturnType<typeof seedTenantWithCase>>;

  beforeEach(async () => {
    seed = await seedTenantWithCase();
  });

  it("RECRUITER can create candidate, FINANCE cannot", async () => {
    await asRole(seed.tenantId, seed.recruiterId, "RECRUITER", null, async () => {
      requirePermission("candidate:create");
      const c = await CandidateService.create(seed.tenantId, seed.recruiterId, {
        fullName: "Role Test Candidate",
        phone: "+971500000001",
      });
      expect(c.id).toBeTruthy();
    });

    await expect(
      asRole(seed.tenantId, seed.adminId, "FINANCE", null, async () => {
        requirePermission("candidate:create");
      })
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("TENANT_ADMIN has requisition:delete; RECRUITER does not", async () => {
    await asRole(seed.tenantId, seed.adminId, "TENANT_ADMIN", null, async () => {
      requirePermission("requisition:delete");
    });
    await expect(
      asRole(seed.tenantId, seed.recruiterId, "RECRUITER", null, async () => {
        requirePermission("requisition:delete");
      })
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("COMPLIANCE_OFFICER can complete step; RECRUITER cannot", async () => {
    await asRole(seed.tenantId, seed.officerId, "COMPLIANCE_OFFICER", null, async () => {
      requirePermission("compliance:complete_step");
    });
    await expect(
      asRole(seed.tenantId, seed.recruiterId, "RECRUITER", null, async () => {
        requirePermission("compliance:complete_step");
      })
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("BRANCH_MANAGER scope filter excludes other-branch candidates", async () => {
    const stamp = Date.now();
    const branchA = await authPrisma.branch.create({
      data: {
        id: `br-a-${stamp}`,
        tenantId: seed.tenantId,
        name: "Branch A",
      },
    });
    const branchB = await authPrisma.branch.create({
      data: {
        id: `br-b-${stamp}`,
        tenantId: seed.tenantId,
        name: "Branch B",
      },
    });
    const mgrA = await authPrisma.user.create({
      data: {
        id: `u-mga-${stamp}`,
        tenantId: seed.tenantId,
        email: `mga-${stamp}@seed.local`,
        name: "Mgr A",
        role: "BRANCH_MANAGER",
        branchId: branchA.id,
        clientCompanyId: null,
      },
    });
    const recA = await authPrisma.user.create({
      data: {
        id: `u-rca-${stamp}`,
        tenantId: seed.tenantId,
        email: `rca-${stamp}@seed.local`,
        name: "Rec A",
        role: "RECRUITER",
        branchId: branchA.id,
        clientCompanyId: null,
      },
    });
    const recB = await authPrisma.user.create({
      data: {
        id: `u-rcb-${stamp}`,
        tenantId: seed.tenantId,
        email: `rcb-${stamp}@seed.local`,
        name: "Rec B",
        role: "RECRUITER",
        branchId: branchB.id,
      },
    });

    await authPrisma.candidateApplication.update({
      where: { id: seed.applicationId },
      data: { recruiterId: recB.id },
    });

    await withUserScope(
      {
        kind: "USER",
        tenantId: seed.tenantId,
        userId: recA.id,
        role: "RECRUITER",
        branchId: branchA.id,
        clientCompanyId: null,
      },
      async () => {
        const c = await CandidateService.create(seed.tenantId, recA.id, {
          fullName: "Branch A Candidate",
          phone: "+971500000099",
        });
        const { ApplicationService } = await import(
          "@/modules/application/application.service"
        );
        await ApplicationService.create(seed.tenantId, recA.id, {
          candidateId: c.id,
          requisitionId: seed.requisitionId,
          recruiterId: recA.id,
        });
      }
    );

    const listed = await withUserScope(
      {
        kind: "USER",
        tenantId: seed.tenantId,
        userId: mgrA.id,
        role: "BRANCH_MANAGER",
        branchId: branchA.id,
        clientCompanyId: null,
      },
      async () => CandidateService.list(seed.tenantId, {})
    );

    const names = listed.items.map((c) => c.fullName);
    expect(names).toContain("Branch A Candidate");
    const seedCandidate = listed.items.find((c) => c.id === seed.candidateId);
    expect(seedCandidate).toBeUndefined();
  });
});
