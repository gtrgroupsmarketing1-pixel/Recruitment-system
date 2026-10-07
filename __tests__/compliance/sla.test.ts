import { describe, it, expect, beforeEach } from "vitest";
import { authPrisma, withTenant } from "@/core/db/client";
import { eventBus } from "@/core/events/event-bus";
import { registerSubscribers, resetSubscriberRegistration } from "@/core/events/register-subscribers";
import { seedTemplateForTenant } from "@/modules/compliance/seeds";
import { ComplianceCaseService } from "@/modules/compliance/compliance.case.service";

const hasDb = Boolean(process.env.DATABASE_URL && process.env.AUTH_DATABASE_URL);

describe.skipIf(!hasDb)("checklist sla", () => {
  beforeEach(() => {
    resetSubscriberRegistration();
    registerSubscribers();
  });
  it("sets dueDate from case creation plus slaDays", async () => {
    const stamp = Date.now();
    const tenant = await authPrisma.tenant.create({
      data: { id: `t-sla-${stamp}`, name: "S", slug: `sla-${stamp}` },
    });
    const user = await authPrisma.user.create({
      data: { id: `u-sla-${stamp}`, tenantId: tenant.id, email: `sla-${stamp}@t.local`, name: "S", role: "RECRUITER" },
    });
    await withTenant(tenant.id, () => seedTemplateForTenant(tenant.id, user.id));
    const client = await authPrisma.clientCompany.create({
      data: { id: `cl-sla-${stamp}`, tenantId: tenant.id, name: "C", code: "SL" },
    });
    const req = await authPrisma.jobRequisition.create({
      data: { id: `rq-sla-${stamp}`, tenantId: tenant.id, clientCompanyId: client.id, reqCode: `SL-${stamp}`, roleCategory: "BLUE_COLLAR", country: "AE", vacancyTarget: 1 },
    });
    const cand = await authPrisma.candidate.create({
      data: { id: `ca-sla-${stamp}`, tenantId: tenant.id, fullName: "S", nationality: "IN" },
    });
    const app = await authPrisma.candidateApplication.create({
      data: { id: `ap-sla-${stamp}`, tenantId: tenant.id, candidateId: cand.id, requisitionId: req.id, status: "SELECTED" },
    });
    await withTenant(tenant.id, () => eventBus.publish({
      type: "candidate.status_changed",
      tenantId: tenant.id,
      payload: { applicationId: app.id, candidateId: cand.id, requisitionId: req.id, from: "CLIENT_INTERVIEWED", to: "SELECTED", actorId: user.id },
    }));
    await eventBus.dispatchPending(tenant.id);
    const row = await withTenant(tenant.id, () => ComplianceCaseService.listCases(tenant.id, {}));
    const detail = await withTenant(tenant.id, () => ComplianceCaseService.getCase(tenant.id, row[0].id));
    expect(detail.steps[0].dueDate).toBeTruthy();
    const before = detail.steps[0].dueDate?.toISOString();
    await withTenant(tenant.id, () => ComplianceCaseService.completeStep(tenant.id, user.id, detail.id, detail.steps[0].id, []));
    const after = await withTenant(tenant.id, () => ComplianceCaseService.getCase(tenant.id, detail.id));
    expect(after.steps[0].dueDate?.toISOString()).toBe(before);
  });
});
