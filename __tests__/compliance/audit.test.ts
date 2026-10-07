import { describe, it, expect, beforeEach } from "vitest";
import { authPrisma, withTenant } from "@/core/db/client";
import { seedTemplateForTenant } from "@/modules/compliance/seeds";
import { ComplianceCaseService } from "@/modules/compliance/compliance.case.service";
import { listCaseAudit } from "@/modules/compliance/compliance.audit.repo";
import { registerSubscribers, resetSubscriberRegistration } from "@/core/events/register-subscribers";
import { eventBus } from "@/core/events/event-bus";

const hasDb = Boolean(process.env.DATABASE_URL && process.env.AUTH_DATABASE_URL);

describe.skipIf(!hasDb)("compliance audit", () => {
  beforeEach(() => {
    resetSubscriberRegistration();
    registerSubscribers();
  });
  it("writes audit on complete and reopen", async () => {
    const stamp = Date.now();
    const tenant = await authPrisma.tenant.create({ data: { id: `t-au-${stamp}`, name: "A", slug: `au-${stamp}` } });
    const user = await authPrisma.user.create({ data: { id: `u-au-${stamp}`, tenantId: tenant.id, email: `au-${stamp}@t.local`, name: "A", role: "RECRUITER" } });
    await withTenant(tenant.id, () => seedTemplateForTenant(tenant.id, user.id));
    const client = await authPrisma.clientCompany.create({ data: { id: `cl-au-${stamp}`, tenantId: tenant.id, name: "C", code: "AU" } });
    const req = await authPrisma.jobRequisition.create({ data: { id: `rq-au-${stamp}`, tenantId: tenant.id, clientCompanyId: client.id, reqCode: `AU-${stamp}`, roleCategory: "BLUE_COLLAR", country: "AE", vacancyTarget: 1 } });
    const cand = await authPrisma.candidate.create({ data: { id: `ca-au-${stamp}`, tenantId: tenant.id, fullName: "A", nationality: "IN" } });
    const app = await authPrisma.candidateApplication.create({ data: { id: `ap-au-${stamp}`, tenantId: tenant.id, candidateId: cand.id, requisitionId: req.id } });
    const template = await authPrisma.complianceTemplate.findFirst({ where: { tenantId: tenant.id } });
    const attached = await withTenant(tenant.id, () => ComplianceCaseService.attachCase(tenant.id, app.id, template!.id, cand.id, req.id));
    const detail = await withTenant(tenant.id, () => ComplianceCaseService.getCase(tenant.id, attached!.id));
    await withTenant(tenant.id, () => ComplianceCaseService.completeStep(tenant.id, user.id, detail.id, detail.steps[0].id, []));
    await eventBus.dispatchPending(tenant.id);
    const rows = await withTenant(tenant.id, () => listCaseAudit(tenant.id, detail.id, 20));
    expect(rows.some((r) => r.newValue === "COMPLETE")).toBe(true);
    await withTenant(tenant.id, () => ComplianceCaseService.uncompleteStep(tenant.id, user.id, detail.id, detail.steps[0].id));
    await eventBus.dispatchPending(tenant.id);
    const reopened = await withTenant(tenant.id, () => listCaseAudit(tenant.id, detail.id, 20));
    expect(reopened.some((r) => r.newValue === "PENDING")).toBe(true);
  });
});
