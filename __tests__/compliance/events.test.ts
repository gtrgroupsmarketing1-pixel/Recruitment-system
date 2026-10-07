import { describe, it, expect, beforeEach } from "vitest";
import { authPrisma, withTenant } from "@/core/db/client";
import { eventBus } from "@/core/events/event-bus";
import { seedTemplateForTenant } from "@/modules/compliance/seeds";
import { ComplianceCaseService } from "@/modules/compliance/compliance.case.service";
import { registerSubscribers, resetSubscriberRegistration } from "@/core/events/register-subscribers";

const hasDb = Boolean(process.env.DATABASE_URL && process.env.AUTH_DATABASE_URL);

describe.skipIf(!hasDb)("compliance events", () => {
  beforeEach(() => {
    resetSubscriberRegistration();
    registerSubscribers();
  });
  it("persists step_completed only after commit", async () => {
    const stamp = Date.now();
    const tenant = await authPrisma.tenant.create({ data: { id: `t-ev-${stamp}`, name: "E", slug: `ev-${stamp}` } });
    const user = await authPrisma.user.create({ data: { id: `u-ev-${stamp}`, tenantId: tenant.id, email: `ev-${stamp}@t.local`, name: "E", role: "RECRUITER" } });
    await withTenant(tenant.id, () => seedTemplateForTenant(tenant.id, user.id));
    const client = await authPrisma.clientCompany.create({ data: { id: `cl-ev-${stamp}`, tenantId: tenant.id, name: "C", code: "EV" } });
    const req = await authPrisma.jobRequisition.create({ data: { id: `rq-ev-${stamp}`, tenantId: tenant.id, clientCompanyId: client.id, reqCode: `EV-${stamp}`, roleCategory: "BLUE_COLLAR", country: "AE", vacancyTarget: 1 } });
    const cand = await authPrisma.candidate.create({ data: { id: `ca-ev-${stamp}`, tenantId: tenant.id, fullName: "E", nationality: "IN" } });
    const app = await authPrisma.candidateApplication.create({ data: { id: `ap-ev-${stamp}`, tenantId: tenant.id, candidateId: cand.id, requisitionId: req.id } });
    const template = await authPrisma.complianceTemplate.findFirst({ where: { tenantId: tenant.id } });
    const attached = await withTenant(tenant.id, () => ComplianceCaseService.attachCase(tenant.id, app.id, template!.id, cand.id, req.id));
    const detail = await withTenant(tenant.id, () => ComplianceCaseService.getCase(tenant.id, attached!.id));
    await withTenant(tenant.id, async () => {
      await ComplianceCaseService.completeStep(tenant.id, user.id, detail.id, detail.steps[0].id, []);
      throw new Error("rollback");
    }).catch(() => undefined);
    const pending = await authPrisma.domainEvent.findMany({
      where: { tenantId: tenant.id, type: "compliance.step_completed" },
    });
    expect(pending).toHaveLength(0);
  });
});
