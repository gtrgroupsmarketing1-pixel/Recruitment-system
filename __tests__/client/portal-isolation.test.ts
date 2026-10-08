import { describe, expect, it } from "vitest";
import { authPrisma, withUserScope } from "@/core/db/client";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { seedTenantWithCase } from "../helpers/seed";
import { ClientPortalService } from "@/modules/client/client.portal.service";
import { ClientReviewService } from "@/modules/client/client.review.service";

describe("client portal isolation", () => {
  it("CLIENT_USER of A cannot see or review company B", async () => {
    const seed = await seedTenantWithCase();
    const stamp = Date.now();
    const b = await authPrisma.clientCompany.create({
      data: {
        id: `cl-b-${stamp}`,
        tenantId: seed.tenantId,
        name: "Other Co",
        code: `B${stamp % 100000}`,
        country: "AE",
      },
    });
    const userA = await authPrisma.user.create({
      data: {
        id: `u-ca-${stamp}`,
        tenantId: seed.tenantId,
        email: `ca-${stamp}@seed.local`,
        name: "Client A",
        role: "CLIENT_USER",
        clientCompanyId: seed.clientId,
      },
    });
    await authPrisma.jobRequisition.update({
      where: { id: seed.requisitionId },
      data: { clientCompanyId: b.id },
    });

    await withUserScope(
      {
        kind: "USER",
        tenantId: seed.tenantId,
        userId: userA.id,
        role: "CLIENT_USER",
        branchId: null,
        clientCompanyId: seed.clientId,
      },
      async () => {
        const rows = await ClientPortalService.listRequisitions(seed.tenantId);
        expect(rows.find((r) => r.id === seed.requisitionId)).toBeUndefined();
        await expect(
          ClientPortalService.getRequisition(seed.tenantId, seed.requisitionId)
        ).rejects.toBeInstanceOf(NotFoundError);
        await expect(
          ClientReviewService.submitDecision(
            seed.tenantId,
            userA.id,
            seed.applicationId,
            "APPROVED",
            null
          )
        ).rejects.toBeInstanceOf(ForbiddenError);
      }
    );
  });
});
