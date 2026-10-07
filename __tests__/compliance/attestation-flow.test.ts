import { describe, it, expect } from "vitest";
import { authPrisma, withTenant } from "@/core/db/client";
import { seedTemplateForTenant } from "@/modules/compliance/seeds";
import { ComplianceCaseService } from "@/modules/compliance/compliance.case.service";
import { ComplianceDetailsService } from "@/modules/compliance/compliance.details.service";
import { StageLockedError } from "@/lib/errors";

const hasDb = Boolean(process.env.DATABASE_URL && process.env.AUTH_DATABASE_URL);

describe.skipIf(!hasDb)("attestation flow", () => {
  it("blocks out-of-order advancement", async () => {
    const stamp = Date.now();
    const tenant = await authPrisma.tenant.create({
      data: { id: `t-att-${stamp}`, name: "A", slug: `att-${stamp}` },
    });
    const user = await authPrisma.user.create({
      data: {
        id: `u-att-${stamp}`,
        tenantId: tenant.id,
        email: `att-${stamp}@test.local`,
        name: "A",
        role: "COMPLIANCE_OFFICER",
      },
    });
    await withTenant(tenant.id, () => seedTemplateForTenant(tenant.id, user.id));
    const client = await authPrisma.clientCompany.create({
      data: { id: `cl-att-${stamp}`, tenantId: tenant.id, name: "C", code: "AT" },
    });
    const req = await authPrisma.jobRequisition.create({
      data: {
        id: `rq-att-${stamp}`,
        tenantId: tenant.id,
        clientCompanyId: client.id,
        reqCode: `AT-${stamp}`,
        roleCategory: "BLUE_COLLAR",
        country: "AE",
        vacancyTarget: 1,
      },
    });
    const cand = await authPrisma.candidate.create({
      data: { id: `ca-att-${stamp}`, tenantId: tenant.id, fullName: "A", nationality: "IN" },
    });
    const app = await authPrisma.candidateApplication.create({
      data: {
        id: `ap-att-${stamp}`,
        tenantId: tenant.id,
        candidateId: cand.id,
        requisitionId: req.id,
      },
    });
    const template = await authPrisma.complianceTemplate.findFirst({ where: { tenantId: tenant.id } });
    const attached = await withTenant(tenant.id, () =>
      ComplianceCaseService.attachCase(tenant.id, app.id, template!.id, cand.id, req.id)
    );
    const caseRow = await withTenant(tenant.id, () =>
      ComplianceCaseService.getCase(tenant.id, attached!.id)
    );
    const attestation = caseRow.steps.find((s) => s.stepOrder === 2);
    const chain = await withTenant(tenant.id, () =>
      ComplianceDetailsService.saveAttestationDetails(tenant.id, user.id, attestation!.id)
    );
    const third = chain!.steps.find((s) => s.stepOrder === 3);
    await expect(
      withTenant(tenant.id, () =>
        ComplianceDetailsService.advanceAttestationStep(tenant.id, third!.id, {})
      )
    ).rejects.toBeInstanceOf(StageLockedError);
  });
});
