import { describe, it, expect, beforeEach } from "vitest";
import { authPrisma, withTenant, db } from "@/core/db/client";
import { eventBus } from "@/core/events/event-bus";
import {
  registerSubscribers,
  resetSubscriberRegistration,
} from "@/core/events/register-subscribers";
import { seedTemplateForTenant } from "@/modules/compliance/seeds";

const hasDb = Boolean(process.env.DATABASE_URL && process.env.AUTH_DATABASE_URL);

describe.skipIf(!hasDb)("compliance subscriber", () => {
  beforeEach(() => {
    resetSubscriberRegistration();
    registerSubscribers();
  });

  it("attaches one India-UAE case on SELECTED and is idempotent", async () => {
    const stamp = Date.now();
    const tenant = await authPrisma.tenant.create({
      data: { id: `t-c-${stamp}`, name: "C", slug: `c-${stamp}` },
    });
    const user = await authPrisma.user.create({
      data: {
        id: `u-c-${stamp}`,
        tenantId: tenant.id,
        email: `c-${stamp}@test.local`,
        name: "Officer",
        role: "COMPLIANCE_OFFICER",
      },
    });
    await withTenant(tenant.id, () => seedTemplateForTenant(tenant.id, user.id));
    const client = await authPrisma.clientCompany.create({
      data: { id: `cl-${stamp}`, tenantId: tenant.id, name: "Client", code: "CL" },
    });
    const req = await authPrisma.jobRequisition.create({
      data: {
        id: `rq-${stamp}`,
        tenantId: tenant.id,
        clientCompanyId: client.id,
        reqCode: `CL-AE-BC-${stamp}`,
        roleCategory: "BLUE_COLLAR",
        country: "AE",
        vacancyTarget: 1,
      },
    });
    const cand = await authPrisma.candidate.create({
      data: {
        id: `ca-${stamp}`,
        tenantId: tenant.id,
        fullName: "Worker",
        nationality: "IN",
      },
    });
    const app = await authPrisma.candidateApplication.create({
      data: {
        id: `ap-${stamp}`,
        tenantId: tenant.id,
        candidateId: cand.id,
        requisitionId: req.id,
        status: "SELECTED",
      },
    });

    const payload = {
      applicationId: app.id,
      candidateId: cand.id,
      requisitionId: req.id,
      from: "CLIENT_INTERVIEWED" as const,
      to: "SELECTED" as const,
      actorId: user.id,
    };
    await withTenant(tenant.id, () =>
      eventBus.publish({
        type: "candidate.status_changed",
        tenantId: tenant.id,
        payload,
      })
    );
    await eventBus.dispatchPending(tenant.id);
    await withTenant(tenant.id, () =>
      eventBus.publish({
        type: "candidate.status_changed",
        tenantId: tenant.id,
        payload,
      })
    );
    await eventBus.dispatchPending(tenant.id);

    const cases = await withTenant(tenant.id, () =>
      db.complianceCase.findMany({
        where: { tenantId: tenant.id, applicationId: app.id },
        include: { checklists: true },
      })
    );
    expect(cases).toHaveLength(1);
    expect(cases[0].checklists).toHaveLength(6);
  });
});
