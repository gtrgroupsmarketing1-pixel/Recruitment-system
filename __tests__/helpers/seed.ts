import { authPrisma, withTenant } from "@/core/db/client";
import { seedTemplateForTenant } from "@/modules/compliance/seeds";
import { ComplianceCaseService } from "@/modules/compliance/compliance.case.service";

export type SeedResult = {
  tenantId: string;
  adminId: string;
  officerId: string;
  recruiterId: string;
  clientId: string;
  requisitionId: string;
  candidateId: string;
  applicationId: string;
  templateId: string;
  caseId: string;
  checklistIds: string[];
};

/**
 * Creates a full tenant stack for integration tests.
 * Tenant creation uses authPrisma (no tenant context). Domain rows use withTenant.
 */
export async function seedTenantWithCase(): Promise<SeedResult> {
  const stamp = Date.now();
  const tenant = await authPrisma.tenant.create({
    data: { id: `t-seed-${stamp}`, name: "Seed Co", slug: `seed-${stamp}` },
  });
  const admin = await authPrisma.user.create({
    data: {
      id: `u-adm-${stamp}`,
      tenantId: tenant.id,
      email: `adm-${stamp}@seed.local`,
      name: "Admin",
      role: "TENANT_ADMIN",
    },
  });
  const officer = await authPrisma.user.create({
    data: {
      id: `u-off-${stamp}`,
      tenantId: tenant.id,
      email: `off-${stamp}@seed.local`,
      name: "Officer",
      role: "COMPLIANCE_OFFICER",
    },
  });
  const recruiter = await authPrisma.user.create({
    data: {
      id: `u-rec-${stamp}`,
      tenantId: tenant.id,
      email: `rec-${stamp}@seed.local`,
      name: "Recruiter",
      role: "RECRUITER",
    },
  });

  const client = await authPrisma.clientCompany.create({
    data: {
      id: `cl-seed-${stamp}`,
      tenantId: tenant.id,
      name: "Client Co",
      code: `SC${stamp % 100000}`,
      country: "AE",
    },
  });
  const requisition = await authPrisma.jobRequisition.create({
    data: {
      id: `rq-seed-${stamp}`,
      tenantId: tenant.id,
      clientCompanyId: client.id,
      reqCode: `SEED-${stamp}`,
      roleCategory: "BLUE_COLLAR",
      country: "AE",
      vacancyTarget: 1,
    },
  });
  const candidate = await authPrisma.candidate.create({
    data: {
      id: `ca-seed-${stamp}`,
      tenantId: tenant.id,
      fullName: "Seed Candidate",
      nationality: "IN",
      phone: "+919999000000",
      email: `cand-${stamp}@seed.local`,
    },
  });
  const application = await authPrisma.candidateApplication.create({
    data: {
      id: `ap-seed-${stamp}`,
      tenantId: tenant.id,
      candidateId: candidate.id,
      requisitionId: requisition.id,
      status: "SELECTED",
    },
  });

  const template = await withTenant(tenant.id, () =>
    seedTemplateForTenant(tenant.id, admin.id)
  );
  const templateId = template.id;

  const attached = await withTenant(tenant.id, () =>
    ComplianceCaseService.attachCase(
      tenant.id,
      application.id,
      templateId,
      candidate.id,
      requisition.id
    )
  );
  if (!attached) throw new Error("seed: attachCase returned null");

  const detail = await withTenant(tenant.id, () =>
    ComplianceCaseService.getCase(tenant.id, attached.id)
  );

  return {
    tenantId: tenant.id,
    adminId: admin.id,
    officerId: officer.id,
    recruiterId: recruiter.id,
    clientId: client.id,
    requisitionId: requisition.id,
    candidateId: candidate.id,
    applicationId: application.id,
    templateId,
    caseId: detail.id,
    checklistIds: detail.steps.map((s) => s.id),
  };
}
