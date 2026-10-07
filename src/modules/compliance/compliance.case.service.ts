import { ConflictError, NotFoundError } from "@/lib/errors";
import { ComplianceCaseRepo } from "./compliance.case.repo";
import { ComplianceTemplateRepo } from "./compliance.template.repo";
import { assertStepUnlocked } from "./compliance.graph";

export const ComplianceCaseService = {
  async attachCase(tenantId: string, applicationId: string, templateId: string, candidateId: string, requisitionId: string) {
    const existing = await ComplianceCaseRepo.findByApplication(tenantId, applicationId);
    if (existing) return existing;
    const template = await ComplianceTemplateRepo.getTemplateWithSteps(tenantId, templateId);
    if (!template) throw new NotFoundError("ComplianceTemplate", templateId);
    try {
      const created = await ComplianceCaseRepo.createCase(tenantId, {
        applicationId,
        candidateId,
        requisitionId,
        templateId,
        status: "IN_PROGRESS",
        currentStepId: template.steps[0]?.id ?? null,
      });
      for (const step of template.steps) {
        await ComplianceCaseRepo.createChecklist(tenantId, {
          caseId: created.id,
          stepTemplateId: step.id,
          stepOrder: step.stepOrder,
          name: step.name,
          status: "PENDING",
          documents: [],
        });
      }
      return ComplianceCaseRepo.findByApplication(tenantId, applicationId);
    } catch (err) {
      if (isUniqueViolation(err)) {
        return ComplianceCaseRepo.findByApplication(tenantId, applicationId);
      }
      throw err;
    }
  },

  async listCases(
    tenantId: string,
    filter?: { status?: string; requisitionId?: string }
  ) {
    return ComplianceCaseRepo.listCases(tenantId, filter);
  },

  async getCase(tenantId: string, caseId: string) {
    const row = await ComplianceCaseRepo.findById(tenantId, caseId);
    if (!row) throw new NotFoundError("ComplianceCase", caseId);
    return decorate(row);
  },

  async completeStep(
    tenantId: string,
    userId: string,
    caseId: string,
    checklistId: string,
    docs: string[]
  ) {
    const case_ = await ComplianceCaseRepo.findById(tenantId, caseId);
    if (!case_) throw new NotFoundError("ComplianceCase", caseId);
    const checklist = case_.checklists.find((c) => c.id === checklistId);
    if (!checklist) throw new NotFoundError("ChecklistInstance", checklistId);
    const stepTemplate = case_.template.steps.find(
      (s) => s.id === checklist.stepTemplateId
    );
    if (!stepTemplate) throw new NotFoundError("ComplianceStepTemplate", checklist.stepTemplateId);
    if (stepTemplate.dependsOnStepId) {
      const dep = case_.checklists.find(
        (c) => c.stepTemplateId === stepTemplate.dependsOnStepId
      );
      assertStepUnlocked({
        stepName: stepTemplate.name,
        dependsOnName: dep?.name ?? null,
        dependsOnStatus: dep?.status ?? null,
      });
    }
    const updated = await ComplianceCaseRepo.completeChecklist(
      tenantId,
      checklistId,
      userId,
      docs
    );
    if (!updated) throw new NotFoundError("ChecklistInstance", checklistId);
    const fresh = await ComplianceCaseRepo.findById(tenantId, caseId);
    if (fresh && fresh.checklists.every((c) => c.status === "COMPLETED")) {
      await ComplianceCaseRepo.updateCaseStatus(tenantId, caseId, "COMPLETED", null);
    } else if (fresh) {
      const next = fresh.checklists.find((c) => c.status !== "COMPLETED");
      await ComplianceCaseRepo.updateCaseStatus(
        tenantId,
        caseId,
        "IN_PROGRESS",
        next?.stepTemplateId ?? null
      );
    }
    return updated;
  },

  async uncompleteStep(tenantId: string, _userId: string, caseId: string, checklistId: string) {
    const case_ = await ComplianceCaseRepo.findById(tenantId, caseId);
    if (!case_) throw new NotFoundError("ComplianceCase", caseId);
    const checklist = case_.checklists.find((c) => c.id === checklistId);
    if (!checklist) throw new NotFoundError("ChecklistInstance", checklistId);
    const updated = await ComplianceCaseRepo.updateChecklistStatus(
      tenantId,
      checklistId,
      "PENDING"
    );
    await ComplianceCaseRepo.updateCaseStatus(tenantId, caseId, "IN_PROGRESS", checklist.stepTemplateId);
    return updated;
  },
};

function decorate<T extends { checklists: Array<{ id: string; stepTemplateId: string; status: string; name: string; stepOrder: number }>; template: { steps: Array<{ id: string; dependsOnStepId: string | null; name: string; connectorId: string | null }> } }>(row: T) {
  const steps = row.checklists.map((c) => {
    const tmpl = row.template.steps.find((s) => s.id === c.stepTemplateId);
    const dep = tmpl?.dependsOnStepId
      ? row.checklists.find((x) => x.stepTemplateId === tmpl.dependsOnStepId)
      : null;
    const locked = Boolean(dep) && dep?.status !== "COMPLETED";
    return {
      id: c.id,
      stepTemplateId: c.stepTemplateId,
      status: c.status,
      name: c.name,
      stepOrder: c.stepOrder,
      locked,
      waitingOn: locked ? dep?.name ?? "unknown" : null,
      connectorId: tmpl?.connectorId ?? null,
    };
  });
  return { ...row, steps };
}

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: string }).code === "P2002"
  );
}

export { ConflictError };
