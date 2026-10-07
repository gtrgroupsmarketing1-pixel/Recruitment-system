import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import { ComplianceTemplateRepo } from "./compliance.template.repo";
import { validateStepGraph, type StepNode } from "./compliance.graph";

export type TemplateStepInput = {
  stepOrder: number;
  name: string;
  responsibleParty: string;
  requiredDocuments: string[];
  slaDays: number;
  dependsOnStepOrder: number | null;
  connectorId: string | null;
};

export const ComplianceTemplateService = {
  async listTemplates(
    tenantId: string,
    filter?: {
      active?: boolean;
      originCountry?: string;
      destinationCountry?: string;
      roleCategory?: string;
    }
  ) {
    return ComplianceTemplateRepo.listTemplates(tenantId, filter);
  },

  async getTemplate(tenantId: string, id: string) {
    const row = await ComplianceTemplateRepo.getTemplateWithSteps(tenantId, id);
    if (!row) throw new NotFoundError("ComplianceTemplate", id);
    return row;
  },

  async createTemplate(
    tenantId: string,
    _userId: string,
    input: {
      name: string;
      originCountry: string;
      destinationCountry: string;
      roleCategory: string;
      isActive?: boolean;
      steps: TemplateStepInput[];
    }
  ) {
    validateStepGraph(input.steps);
    const template = await ComplianceTemplateRepo.createTemplate(tenantId, {
      name: input.name,
      originCountry: input.originCountry,
      destinationCountry: input.destinationCountry,
      roleCategory: input.roleCategory,
      isActive: input.isActive ?? true,
    });
    const created = await persistSteps(tenantId, template.id, input.steps);
    return { ...template, steps: created };
  },

  async updateTemplate(
    tenantId: string,
    _userId: string,
    id: string,
    input: {
      name?: string;
      originCountry?: string;
      destinationCountry?: string;
      roleCategory?: string;
      isActive?: boolean;
    }
  ) {
    const updated = await ComplianceTemplateRepo.updateTemplate(tenantId, id, input);
    if (!updated) throw new NotFoundError("ComplianceTemplate", id);
    return updated;
  },

  async deleteTemplate(tenantId: string, _userId: string, id: string) {
    const count = await ComplianceTemplateRepo.softDeleteTemplate(tenantId, id);
    if (count === 0) throw new NotFoundError("ComplianceTemplate", id);
  },

  async addStep(
    tenantId: string,
    _userId: string,
    templateId: string,
    input: TemplateStepInput
  ) {
    const existing = await ComplianceTemplateRepo.listSteps(tenantId, templateId);
    if (existing.length === 0) {
      const header = await ComplianceTemplateRepo.getTemplateWithSteps(
        tenantId,
        templateId
      );
      if (!header) throw new NotFoundError("ComplianceTemplate", templateId);
    }
    const graph = [
      ...existing.map((s) => ({
        stepOrder: s.stepOrder,
        name: s.name,
        dependsOnStepOrder: orderOf(existing, s.dependsOnStepId),
      })),
      input,
    ];
    validateStepGraph(graph);
    const dependsOnStepId = idOf(existing, input.dependsOnStepOrder);
    return ComplianceTemplateRepo.createStep(tenantId, {
      templateId,
      stepOrder: input.stepOrder,
      name: input.name,
      responsibleParty: input.responsibleParty,
      requiredDocuments: input.requiredDocuments,
      slaDays: input.slaDays,
      dependsOnStepId,
      connectorId: input.connectorId,
    });
  },

  async updateStep(
    tenantId: string,
    _userId: string,
    stepId: string,
    input: Partial<TemplateStepInput>
  ) {
    const step = await ComplianceTemplateRepo.getStep(tenantId, stepId);
    if (!step) throw new NotFoundError("ComplianceStepTemplate", stepId);
    const existing = await ComplianceTemplateRepo.listSteps(tenantId, step.templateId);
    const next = existing.map((s) => {
      if (s.id !== stepId) {
        return {
          stepOrder: s.stepOrder,
          name: s.name,
          dependsOnStepOrder: orderOf(existing, s.dependsOnStepId),
        };
      }
      return {
        stepOrder: input.stepOrder ?? s.stepOrder,
        name: input.name ?? s.name,
        dependsOnStepOrder:
          input.dependsOnStepOrder === undefined
            ? orderOf(existing, s.dependsOnStepId)
            : input.dependsOnStepOrder,
      };
    });
    validateStepGraph(next);
    const dependsOnStepId =
      input.dependsOnStepOrder === undefined
        ? undefined
        : idOf(existing, input.dependsOnStepOrder);
    return ComplianceTemplateRepo.updateStep(tenantId, stepId, {
      stepOrder: input.stepOrder,
      name: input.name,
      responsibleParty: input.responsibleParty,
      requiredDocuments: input.requiredDocuments,
      slaDays: input.slaDays,
      connectorId: input.connectorId,
      dependsOnStepId,
    });
  },

  async removeStep(
    tenantId: string,
    _userId: string,
    stepId: string,
    force: boolean
  ) {
    const step = await ComplianceTemplateRepo.getStep(tenantId, stepId);
    if (!step) throw new NotFoundError("ComplianceStepTemplate", stepId);
    const existing = await ComplianceTemplateRepo.listSteps(tenantId, step.templateId);
    const dependents = existing.filter((s) => s.dependsOnStepId === stepId);
    if (dependents.length > 0 && !force) {
      throw new ValidationError(
        "Step has dependents. Pass force to remove."
      );
    }
    const count = await ComplianceTemplateRepo.deleteStep(tenantId, stepId);
    if (count === 0) throw new NotFoundError("ComplianceStepTemplate", stepId);
  },

  async requireMatchingTemplate(
    tenantId: string,
    originCountry: string,
    destinationCountry: string,
    roleCategory: string
  ) {
    const matches = await ComplianceTemplateRepo.findMatchingTemplates(
      tenantId,
      originCountry,
      destinationCountry,
      roleCategory
    );
    if (matches.length === 0) return null;
    if (matches.length !== 1) {
      throw new ConflictError(
        `Ambiguous compliance templates for ${originCountry}->${destinationCountry}/${roleCategory}`
      );
    }
    return matches[0];
  },
};

async function persistSteps(
  tenantId: string,
  templateId: string,
  steps: TemplateStepInput[]
) {
  const created: Array<{ id: string; stepOrder: number }> = [];
  const ordered = [...steps].sort((a, b) => a.stepOrder - b.stepOrder);
  for (const step of ordered) {
    const dependsOnStepId = idOf(created, step.dependsOnStepOrder);
    const row = await ComplianceTemplateRepo.createStep(tenantId, {
      templateId,
      stepOrder: step.stepOrder,
      name: step.name,
      responsibleParty: step.responsibleParty,
      requiredDocuments: step.requiredDocuments,
      slaDays: step.slaDays,
      dependsOnStepId,
      connectorId: step.connectorId,
    });
    created.push(row);
  }
  return created;
}

function orderOf(
  steps: Array<{ id: string; stepOrder: number }>,
  id: string | null
): number | null {
  if (!id) return null;
  return steps.find((s) => s.id === id)?.stepOrder ?? null;
}

function idOf(
  steps: Array<{ id: string; stepOrder: number }>,
  order: number | null
): string | null {
  if (order === null) return null;
  return steps.find((s) => s.stepOrder === order)?.id ?? null;
}

export type { StepNode };
