import { describe, expect, it } from "vitest";
import { authPrisma, withUserScope } from "@/core/db/client";
import { seedTenantWithCase } from "../helpers/seed";
import { JobOrderService } from "@/modules/client/joborder.service";

describe("job order flow", () => {
  it("submits pending, accepts into a requisition, and rejects another", async () => {
    const seed = await seedTenantWithCase();
    const stamp = Date.now();
    const user = await authPrisma.user.create({
      data: {
        id: `u-jo-${stamp}`,
        tenantId: seed.tenantId,
        email: `jo-${stamp}@seed.local`,
        name: "Client",
        role: "CLIENT_USER",
        clientCompanyId: seed.clientId,
      },
    });
    const pending = await withUserScope(
      {
        kind: "USER",
        tenantId: seed.tenantId,
        userId: user.id,
        role: "CLIENT_USER",
        branchId: null,
        clientCompanyId: seed.clientId,
      },
      () =>
        JobOrderService.submit(seed.tenantId, user.id, {
          roleTitle: "Driver",
          roleCategory: "DRV",
          country: "AE",
          vacancyCount: 2,
        })
    );
    expect(pending.status).toBe("PENDING");

    const converted = await withUserScope(
      {
        kind: "USER",
        tenantId: seed.tenantId,
        userId: seed.adminId,
        role: "TENANT_ADMIN",
        branchId: null,
        clientCompanyId: null,
      },
      () => JobOrderService.review(seed.tenantId, seed.adminId, pending.id, "ACCEPT", "ok")
    );
    expect(converted.status).toBe("CONVERTED");
    expect(converted.requisitionId).toBeTruthy();

    const second = await withUserScope(
      {
        kind: "USER",
        tenantId: seed.tenantId,
        userId: user.id,
        role: "CLIENT_USER",
        branchId: null,
        clientCompanyId: seed.clientId,
      },
      () =>
        JobOrderService.submit(seed.tenantId, user.id, {
          roleTitle: "Cook",
          roleCategory: "CK",
          country: "AE",
          vacancyCount: 1,
        })
    );
    const rejected = await withUserScope(
      {
        kind: "USER",
        tenantId: seed.tenantId,
        userId: seed.adminId,
        role: "TENANT_ADMIN",
        branchId: null,
        clientCompanyId: null,
      },
      () => JobOrderService.review(seed.tenantId, seed.adminId, second.id, "REJECT", "no budget")
    );
    expect(rejected.status).toBe("REJECTED");
    expect(rejected.reviewNotes).toBe("no budget");
  });
});
