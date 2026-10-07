import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { authPrisma, withTenant } from "@/core/db/client";
import { ConnectorConfigService } from "@/modules/connector/connector.config.service";
import { ConnectorCheckService } from "@/modules/connector/connector.check.service";
import * as registry from "@/core/connectors/registry";

const hasDb = Boolean(process.env.DATABASE_URL && process.env.AUTH_DATABASE_URL);

describe.skipIf(!hasDb)("ConnectorCheckService", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("startTracking rejects disabled connector", async () => {
    const stamp = Date.now();
    const tenant = await authPrisma.tenant.create({
      data: { id: `t-ck-${stamp}`, name: "C", slug: `ck-${stamp}` },
    });
    const user = await authPrisma.user.create({
      data: {
        id: `u-ck-${stamp}`,
        tenantId: tenant.id,
        email: `ck-${stamp}@t.local`,
        name: "A",
        role: "COMPLIANCE_OFFICER",
      },
    });
    const template = await authPrisma.complianceTemplate.create({
      data: {
        id: `tpl-ck-${stamp}`,
        tenantId: tenant.id,
        originCountry: "IN",
        destinationCountry: "AE",
        roleCategory: "BLUE_COLLAR",
        name: "T",
      },
    });
    const step = await authPrisma.complianceStepTemplate.create({
      data: {
        id: `st-ck-${stamp}`,
        tenantId: tenant.id,
        templateId: template.id,
        stepOrder: 1,
        name: "Medical",
        responsibleParty: "CANDIDATE",
        requiredDocuments: [],
        slaDays: 7,
        connectorId: "wafid",
      },
    });
    const client = await authPrisma.clientCompany.create({
      data: { id: `cl-ck-${stamp}`, tenantId: tenant.id, name: "C", code: "CK" },
    });
    const req = await authPrisma.jobRequisition.create({
      data: {
        id: `rq-ck-${stamp}`,
        tenantId: tenant.id,
        clientCompanyId: client.id,
        reqCode: `CK-${stamp}`,
        roleCategory: "BLUE_COLLAR",
        country: "AE",
        vacancyTarget: 1,
      },
    });
    const cand = await authPrisma.candidate.create({
      data: {
        id: `ca-ck-${stamp}`,
        tenantId: tenant.id,
        fullName: "A",
        nationality: "IN",
      },
    });
    const app = await authPrisma.candidateApplication.create({
      data: {
        id: `ap-ck-${stamp}`,
        tenantId: tenant.id,
        candidateId: cand.id,
        requisitionId: req.id,
      },
    });
    const caseRow = await authPrisma.complianceCase.create({
      data: {
        id: `cs-ck-${stamp}`,
        tenantId: tenant.id,
        applicationId: app.id,
        candidateId: cand.id,
        requisitionId: req.id,
        templateId: template.id,
      },
    });
    const checklist = await authPrisma.checklistInstance.create({
      data: {
        id: `ch-ck-${stamp}`,
        tenantId: tenant.id,
        caseId: caseRow.id,
        stepTemplateId: step.id,
        stepOrder: 1,
        name: "Medical",
      },
    });

    await expect(
      withTenant(tenant.id, () =>
        ConnectorCheckService.startTracking(
          tenant.id,
          user.id,
          checklist.id,
          "1234567890"
        )
      )
    ).rejects.toThrow(/not enabled/i);
  });
});
