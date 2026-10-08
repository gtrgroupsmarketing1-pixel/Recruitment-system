import { describe, expect, it } from "vitest";
import { authPrisma, withUserScope } from "@/core/db/client";
import { ValidationError } from "@/lib/errors";
import { seedTenantWithCase } from "../helpers/seed";
import { ClientReviewService } from "@/modules/client/client.review.service";
import { ApplicationRepo } from "@/modules/application/application.repo";

describe("client review flow", () => {
  it("writes a comment and does not advance status", async () => {
    const seed = await seedTenantWithCase();
    const stamp = Date.now();
    const user = await authPrisma.user.create({
      data: {
        id: `u-cr-${stamp}`,
        tenantId: seed.tenantId,
        email: `cr-${stamp}@seed.local`,
        name: "Client",
        role: "CLIENT_USER",
        clientCompanyId: seed.clientId,
      },
    });
    await authPrisma.candidateApplication.update({
      where: { id: seed.applicationId },
      data: { status: "CLIENT_INTERVIEWED" },
    });
    const before = await authPrisma.candidateApplication.findUnique({
      where: { id: seed.applicationId },
    });

    const comment = await withUserScope(
      {
        kind: "USER",
        tenantId: seed.tenantId,
        userId: user.id,
        role: "CLIENT_USER",
        branchId: null,
        clientCompanyId: seed.clientId,
      },
      () =>
        ClientReviewService.submitDecision(
          seed.tenantId,
          user.id,
          seed.applicationId,
          "APPROVED",
          "Looks good"
        )
    );
    expect(comment.decision).toBe("APPROVED");
    const after = await authPrisma.candidateApplication.findUnique({
      where: { id: seed.applicationId },
    });
    expect(after?.status).toBe(before?.status);
    const event = await authPrisma.domainEvent.findFirst({
      where: { tenantId: seed.tenantId, type: "client.candidate_decision" },
    });
    expect(event).toBeTruthy();
    void ApplicationRepo;
  });

  it("rejects review before CLIENT_INTERVIEWED", async () => {
    const seed = await seedTenantWithCase();
    const stamp = Date.now();
    const user = await authPrisma.user.create({
      data: {
        id: `u-ce-${stamp}`,
        tenantId: seed.tenantId,
        email: `ce-${stamp}@seed.local`,
        name: "Client",
        role: "CLIENT_USER",
        clientCompanyId: seed.clientId,
      },
    });
    await authPrisma.candidateApplication.update({
      where: { id: seed.applicationId },
      data: { status: "SHORTLISTED" },
    });
    await expect(
      withUserScope(
        {
          kind: "USER",
          tenantId: seed.tenantId,
          userId: user.id,
          role: "CLIENT_USER",
          branchId: null,
          clientCompanyId: seed.clientId,
        },
        () =>
          ClientReviewService.submitDecision(
            seed.tenantId,
            user.id,
            seed.applicationId,
            "APPROVED",
            null
          )
      )
    ).rejects.toBeInstanceOf(ValidationError);
  });
});
