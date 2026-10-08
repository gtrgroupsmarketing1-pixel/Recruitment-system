import { describe, expect, it, beforeEach } from "vitest";
import { withUserScope } from "@/core/db/client";
import { ForbiddenError } from "@/lib/errors";
import { seedTenantWithCase } from "../helpers/seed";
import { ApplicationRepo } from "@/modules/application/application.repo";
import { ApplicationService } from "@/modules/application/application.service";
import { requireChangeStatusPermission } from "@/core/auth/status-permission";
import { getUserScope } from "@/core/auth/scope";
import { PIPELINE_ORDER } from "@/modules/application/application.status-order";
import { STATUS, type Status } from "@/modules/application/application.state-machine";

/**
 * Same checks the changeStatus router and action run, without importing tRPC
 * (that pulls NextAuth, which CI's ignore-scripts install cannot resolve).
 */
async function changeStatusAs(
  tenantId: string,
  userId: string,
  role: "MOBILIZATION_OFFICER" | "TENANT_ADMIN",
  applicationId: string,
  toStatus: Status
) {
  return withUserScope(
    { kind: "USER", tenantId, userId, role, branchId: null },
    async () => {
      const app = await ApplicationRepo.findById(tenantId, applicationId);
      if (!app) throw new Error("missing application");
      requireChangeStatusPermission(getUserScope(), app.status as Status, toStatus);
      return ApplicationService.changeStatus(tenantId, userId, applicationId, toStatus);
    }
  );
}

describe("status-gated changeStatus", () => {
  let seed: Awaited<ReturnType<typeof seedTenantWithCase>>;

  beforeEach(async () => {
    seed = await seedTenantWithCase();
  });

  it("blocks mobilization officer at SOURCED and allows from TRAVELED", async () => {
    await expect(
      changeStatusAs(
        seed.tenantId,
        seed.officerId,
        "MOBILIZATION_OFFICER",
        seed.applicationId,
        STATUS.SCREENED
      )
    ).rejects.toBeInstanceOf(ForbiddenError);

    const current = await withUserScope(
      { kind: "USER", tenantId: seed.tenantId, userId: seed.adminId, role: "TENANT_ADMIN", branchId: null },
      () => ApplicationRepo.findById(seed.tenantId, seed.applicationId)
    );
    const startIdx = PIPELINE_ORDER.indexOf(current!.status as Status);
    const traveledIdx = PIPELINE_ORDER.indexOf(STATUS.TRAVELED);
    for (let i = startIdx; i < traveledIdx; i++) {
      await changeStatusAs(
        seed.tenantId,
        seed.adminId,
        "TENANT_ADMIN",
        seed.applicationId,
        PIPELINE_ORDER[i + 1]
      );
    }

    const moved = await changeStatusAs(
      seed.tenantId,
      seed.officerId,
      "MOBILIZATION_OFFICER",
      seed.applicationId,
      STATUS.MOBILIZED
    );
    expect(moved.status).toBe(STATUS.MOBILIZED);
  });
});
