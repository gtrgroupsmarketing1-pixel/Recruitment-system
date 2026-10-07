import { describe, it, expect, beforeEach } from "vitest";
import { authPrisma, withTenant, db } from "@/core/db/client";
import { eventBus } from "@/core/events/event-bus";
import {
  registerSubscribers,
  resetSubscriberRegistration,
} from "@/core/events/register-subscribers";

const hasDb = Boolean(process.env.DATABASE_URL && process.env.AUTH_DATABASE_URL);

describe.skipIf(!hasDb)("task subscriber", () => {
  beforeEach(() => {
    resetSubscriberRegistration();
    registerSubscribers();
  });

  it("creates one task per transition and is idempotent", async () => {
    const stamp = Date.now();
    const tenant = await authPrisma.tenant.create({
      data: {
        id: `t-task-${stamp}`,
        name: "Task Tenant",
        slug: `task-${stamp}`,
      },
    });
    const user = await authPrisma.user.create({
      data: {
        id: `u-task-${stamp}`,
        tenantId: tenant.id,
        email: `task-${stamp}@test.local`,
        name: "Recruiter",
        role: "RECRUITER",
      },
    });
    const client = await authPrisma.clientCompany.create({
      data: {
        id: `c-task-${stamp}`,
        tenantId: tenant.id,
        name: "Client",
        code: "CLT",
      },
    });
    const req = await authPrisma.jobRequisition.create({
      data: {
        id: `r-task-${stamp}`,
        tenantId: tenant.id,
        clientCompanyId: client.id,
        reqCode: `CLT-AE-BC-202610-1`,
        roleCategory: "BC",
        country: "AE",
        vacancyTarget: 1,
        status: "OPEN",
      },
    });
    const cand = await authPrisma.candidate.create({
      data: {
        id: `cand-task-${stamp}`,
        tenantId: tenant.id,
        fullName: "Task Candidate",
      },
    });
    const app = await authPrisma.candidateApplication.create({
      data: {
        id: `app-task-${stamp}`,
        tenantId: tenant.id,
        candidateId: cand.id,
        requisitionId: req.id,
        status: "SCREENED",
      },
    });

    await withTenant(tenant.id, async () => {
      await eventBus.publish({
        type: "candidate.status_changed",
        tenantId: tenant.id,
        payload: {
          applicationId: app.id,
          candidateId: cand.id,
          requisitionId: req.id,
          from: "SCREENED",
          to: "SHORTLISTED",
          actorId: user.id,
        },
      });
    });
    await eventBus.dispatchPending(tenant.id);

    const first = await withTenant(tenant.id, () =>
      db.task.findMany({
        where: { tenantId: tenant.id, refId: app.id },
      })
    );
    expect(first).toHaveLength(1);
    expect(first[0].type).toBe("CLIENT_UPDATE");

    await withTenant(tenant.id, async () => {
      await eventBus.publish({
        type: "candidate.status_changed",
        tenantId: tenant.id,
        payload: {
          applicationId: app.id,
          candidateId: cand.id,
          requisitionId: req.id,
          from: "SCREENED",
          to: "SHORTLISTED",
          actorId: user.id,
        },
      });
    });
    await eventBus.dispatchPending(tenant.id);

    const second = await withTenant(tenant.id, () =>
      db.task.findMany({
        where: { tenantId: tenant.id, refId: app.id },
      })
    );
    expect(second).toHaveLength(1);
  });
});
