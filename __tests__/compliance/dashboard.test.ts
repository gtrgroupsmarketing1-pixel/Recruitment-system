import { describe, it, expect } from "vitest";
import { authPrisma, withTenant } from "@/core/db/client";
import { ComplianceDashboardService } from "@/modules/compliance/compliance.dashboard.service";
import { seedTemplateForTenant } from "@/modules/compliance/seeds";
import { ComplianceCaseService } from "@/modules/compliance/compliance.case.service";

const hasDb = Boolean(process.env.DATABASE_URL && process.env.AUTH_DATABASE_URL);

describe.skipIf(!hasDb)("compliance dashboard", () => {
  it("lists only the caller tenant and runs the bottleneck query", async () => {
    const stamp = Date.now();
    const tenant = await authPrisma.tenant.create({ data: { id: `t-dash-${stamp}`, name: "D", slug: `dash-${stamp}` } });
    const other = await authPrisma.tenant.create({ data: { id: `t-dashb-${stamp}`, name: "B", slug: `dashb-${stamp}` } });
    const user = await authPrisma.user.create({ data: { id: `u-dash-${stamp}`, tenantId: tenant.id, email: `dash-${stamp}@t.local`, name: "D", role: "COMPLIANCE_OFFICER" } });
    await withTenant(tenant.id, () => seedTemplateForTenant(tenant.id, user.id));
    const client = await authPrisma.clientCompany.create({ data: { id: `cl-dash-${stamp}`, tenantId: tenant.id, name: "C", code: "DS" } });
    const req = await authPrisma.jobRequisition.create({ data: { id: `rq-dash-${stamp}`, tenantId: tenant.id, clientCompanyId: client.id, reqCode: `DS-${stamp}`, roleCategory: "BLUE_COLLAR", country: "AE", vacancyTarget: 1 } });
    const cand = await authPrisma.candidate.create({ data: { id: `ca-dash-${stamp}`, tenantId: tenant.id, fullName: "Dash", nationality: "IN" } });
    const app = await authPrisma.candidateApplication.create({ data: { id: `ap-dash-${stamp}`, tenantId: tenant.id, candidateId: cand.id, requisitionId: req.id } });
    const template = await authPrisma.complianceTemplate.findFirst({ where: { tenantId: tenant.id } });
    await withTenant(tenant.id, () => ComplianceCaseService.attachCase(tenant.id, app.id, template!.id, cand.id, req.id));
    const rows = await withTenant(tenant.id, () => ComplianceDashboardService.listAtRiskCases(tenant.id, { limit: 20 }));
    expect(rows.every((row) => row.candidateName === "Dash")).toBe(true);
    const otherRows = await withTenant(other.id, () => ComplianceDashboardService.listAtRiskCases(other.id, { limit: 20 }));
    expect(otherRows).toHaveLength(0);
    const bottlenecks = await withTenant(tenant.id, () => ComplianceDashboardService.listBottlenecks(tenant.id));
    expect(bottlenecks.length).toBeGreaterThan(0);
  });
});
