import { describe, it, expect } from "vitest";
import { authPrisma, withTenant } from "@/core/db/client";
import { seedTemplateForTenant } from "@/modules/compliance/seeds";
import { ComplianceCaseService } from "@/modules/compliance/compliance.case.service";
import { ComplianceDetailsService } from "@/modules/compliance/compliance.details.service";

const hasDb = Boolean(process.env.DATABASE_URL && process.env.AUTH_DATABASE_URL);

describe.skipIf(!hasDb)("compliance details", () => {
  it("upserts medical details and returns MEDICAL kind", async () => {
    const stamp = Date.now();
    const tenant = await authPrisma.tenant.create({
      data: { id: `t-det-${stamp}`, name: "D", slug: `det-${stamp}` },
    });
    const user = await authPrisma.user.create({
      data: {
        id: `u-det-${stamp}`,
        tenantId: tenant.id,
        email: `det-${stamp}@test.local`,
        name: "D",
        role: "RECRUITER",
      },
    });
    await withTenant(tenant.id, () => seedTemplateForTenant(tenant.id, user.id));
    const client = await authPrisma.clientCompany.create({
      data: { id: `cl-det-${stamp}`, tenantId: tenant.id, name: "C", code: "DT" },
    });
    const req = await authPrisma.jobRequisition.create({
      data: {
        id: `rq-det-${stamp}`,
        tenantId: tenant.id,
        clientCompanyId: client.id,
        reqCode: `DT-${stamp}`,
        roleCategory: "BLUE_COLLAR",
        country: "AE",
        vacancyTarget: 1,
      },
    });
    const cand = await authPrisma.candidate.create({
      data: { id: `ca-det-${stamp}`, tenantId: tenant.id, fullName: "D", nationality: "IN" },
    });
    const app = await authPrisma.candidateApplication.create({
      data: {
        id: `ap-det-${stamp}`,
        tenantId: tenant.id,
        candidateId: cand.id,
        requisitionId: req.id,
      },
    });
    const template = await withTenant(tenant.id, () =>
      authPrisma.complianceTemplate.findFirst({ where: { tenantId: tenant.id } })
    );
    const attached = await withTenant(tenant.id, () =>
      ComplianceCaseService.attachCase(tenant.id, app.id, template!.id, cand.id, req.id)
    );
    const caseRow = await withTenant(tenant.id, () =>
      ComplianceCaseService.getCase(tenant.id, attached!.id)
    );
    const step = caseRow.steps[0];
    await withTenant(tenant.id, () =>
      ComplianceDetailsService.saveMedicalDetails(tenant.id, user.id, step.id, {
        centerName: "Wafid Center",
        result: "FIT",
      })
    );
    await withTenant(tenant.id, () =>
      ComplianceDetailsService.saveMedicalDetails(tenant.id, user.id, step.id, {
        centerName: "Wafid Center 2",
      })
    );
    const details = await withTenant(tenant.id, () =>
      ComplianceDetailsService.getDetails(tenant.id, step.id, "wafid")
    );
    expect(details.kind).toBe("MEDICAL");
    if (details.kind === "MEDICAL") expect(details.medical.centerName).toBe("Wafid Center 2");
    const rows = await authPrisma.medicalClearance.findMany({ where: { checklistId: step.id } });
    expect(rows).toHaveLength(1);
  });
});
