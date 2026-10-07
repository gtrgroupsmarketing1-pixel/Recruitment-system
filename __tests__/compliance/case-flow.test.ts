import { describe, it, expect, beforeEach } from "vitest";
import { authPrisma, withTenant } from "@/core/db/client";
import { eventBus } from "@/core/events/event-bus";
import {
  registerSubscribers,
  resetSubscriberRegistration,
} from "@/core/events/register-subscribers";
import { seedTemplateForTenant } from "@/modules/compliance/seeds";
import { ComplianceCaseService } from "@/modules/compliance/compliance.case.service";
import { StageLockedError } from "@/lib/errors";

const hasDb = Boolean(process.env.DATABASE_URL && process.env.AUTH_DATABASE_URL);

describe.skipIf(!hasDb)("compliance case flow", () => {
  beforeEach(() => {
    resetSubscriberRegistration();
    registerSubscribers();
  });

  it("attaches six steps, locks skips, completes, and uncomplete does not cascade", async () => {
    const stamp = Date.now();
    const tenant = await authPrisma.tenant.create({
      data: { id: `t-flow-${stamp}`, name: "Flow", slug: `flow-${stamp}` },
    });
    const user = await authPrisma.user.create({
      data: {
        id: `u-flow-${stamp}`,
        tenantId: tenant.id,
        email: `flow-${stamp}@test.local`,
        name: "Officer",
        role: "COMPLIANCE_OFFICER",
      },
    });
    await withTenant(tenant.id, () => seedTemplateForTenant(tenant.id, user.id));
    const client = await authPrisma.clientCompany.create({
      data: { id: `cl-flow-${stamp}`, tenantId: tenant.id, name: "C", code: "FL" },
    });
    const req = await authPrisma.jobRequisition.create({
      data: {
        id: `rq-flow-${stamp}`,
        tenantId: tenant.id,
        clientCompanyId: client.id,
        reqCode: `FL-AE-${stamp}`,
        roleCategory: "BLUE_COLLAR",
        country: "AE",
        vacancyTarget: 1,
      },
    });
    const cand = await authPrisma.candidate.create({
      data: {
        id: `ca-flow-${stamp}`,
        tenantId: tenant.id,
        fullName: "Flow",
        nationality: "IN",
      },
    });
    const app = await authPrisma.candidateApplication.create({
      data: {
        id: `ap-flow-${stamp}`,
        tenantId: tenant.id,
        candidateId: cand.id,
        requisitionId: req.id,
        status: "SELECTED",
      },
    });
    await withTenant(tenant.id, () =>
      eventBus.publish({
        type: "candidate.status_changed",
        tenantId: tenant.id,
        payload: {
          applicationId: app.id,
          candidateId: cand.id,
          requisitionId: req.id,
          from: "CLIENT_INTERVIEWED",
          to: "SELECTED",
          actorId: user.id,
        },
      })
    );
    await eventBus.dispatchPending(tenant.id);

    const attached = await withTenant(tenant.id, () =>
      ComplianceCaseService.listCases(tenant.id, { requisitionId: req.id })
    );
    expect(attached).toHaveLength(1);
    expect(attached[0].status).toBe("IN_PROGRESS");
    const detail = await withTenant(tenant.id, () =>
      ComplianceCaseService.getCase(tenant.id, attached[0].id)
    );
    expect(detail.steps).toHaveLength(6);
    expect(detail.steps[0].locked).toBe(false);
    expect(detail.steps[1].locked).toBe(true);

    await withTenant(tenant.id, () =>
      ComplianceCaseService.completeStep(tenant.id, user.id, detail.id, detail.steps[0].id, [])
    );
    await expect(
      withTenant(tenant.id, () =>
        ComplianceCaseService.completeStep(tenant.id, user.id, detail.id, detail.steps[2].id, [])
      )
    ).rejects.toBeInstanceOf(StageLockedError);

    const after1 = await withTenant(tenant.id, () =>
      ComplianceCaseService.getCase(tenant.id, detail.id)
    );
    for (const step of after1.steps.slice(1)) {
      await withTenant(tenant.id, () =>
        ComplianceCaseService.completeStep(tenant.id, user.id, detail.id, step.id, [])
      );
    }
    const done = await withTenant(tenant.id, () =>
      ComplianceCaseService.getCase(tenant.id, detail.id)
    );
    expect(done.status).toBe("COMPLETED");
    expect(done.steps.every((s) => s.status === "COMPLETED")).toBe(true);

    await withTenant(tenant.id, () =>
      ComplianceCaseService.uncompleteStep(tenant.id, user.id, detail.id, detail.steps[2].id)
    );
    const corrected = await withTenant(tenant.id, () =>
      ComplianceCaseService.getCase(tenant.id, detail.id)
    );
    const step3 = corrected.steps.find((s) => s.stepOrder === 3);
    const step4 = corrected.steps.find((s) => s.stepOrder === 4);
    expect(step3?.status).toBe("PENDING");
    expect(step4?.status).toBe("COMPLETED");
  });
});
