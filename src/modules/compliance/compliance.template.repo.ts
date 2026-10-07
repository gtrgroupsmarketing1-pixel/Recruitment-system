import { db } from "@/core/db/client";
import type { Prisma } from "@prisma/client";

export const ComplianceTemplateRepo = {
  async listTemplates(
    tenantId: string,
    filter?: {
      active?: boolean;
      originCountry?: string;
      destinationCountry?: string;
      roleCategory?: string;
    }
  ) {
    return db.complianceTemplate.findMany({
      where: {
        tenantId,
        deletedAt: null,
        ...(filter?.active === undefined ? {} : { isActive: filter.active }),
        ...(filter?.originCountry ? { originCountry: filter.originCountry } : {}),
        ...(filter?.destinationCountry
          ? { destinationCountry: filter.destinationCountry }
          : {}),
        ...(filter?.roleCategory ? { roleCategory: filter.roleCategory } : {}),
      },
      orderBy: { updatedAt: "desc" },
    });
  },

  async getTemplateWithSteps(tenantId: string, templateId: string) {
    return db.complianceTemplate.findFirst({
      where: { id: templateId, tenantId, deletedAt: null },
      include: { steps: { orderBy: { stepOrder: "asc" } } },
    });
  },

  async getStep(tenantId: string, stepId: string) {
    return db.complianceStepTemplate.findFirst({
      where: { id: stepId, tenantId },
    });
  },

  async findMatchingTemplates(
    tenantId: string,
    originCountry: string,
    destinationCountry: string,
    roleCategory: string
  ) {
    return db.complianceTemplate.findMany({
      where: {
        tenantId,
        originCountry,
        destinationCountry,
        roleCategory,
        isActive: true,
        deletedAt: null,
      },
      include: { steps: { orderBy: { stepOrder: "asc" } } },
    });
  },

  async createTemplate(
    tenantId: string,
    data: Omit<Prisma.ComplianceTemplateUncheckedCreateInput, "tenantId">
  ) {
    return db.complianceTemplate.create({ data: { ...data, tenantId } });
  },

  async createStep(
    tenantId: string,
    data: Omit<Prisma.ComplianceStepTemplateUncheckedCreateInput, "tenantId">
  ) {
    return db.complianceStepTemplate.create({ data: { ...data, tenantId } });
  },

  async updateTemplate(
    tenantId: string,
    id: string,
    data: Prisma.ComplianceTemplateUncheckedUpdateInput
  ) {
    const result = await db.complianceTemplate.updateMany({
      where: { id, tenantId, deletedAt: null },
      data,
    });
    if (result.count === 0) return null;
    return db.complianceTemplate.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
  },

  async updateStep(
    tenantId: string,
    id: string,
    data: Prisma.ComplianceStepTemplateUncheckedUpdateInput
  ) {
    const result = await db.complianceStepTemplate.updateMany({
      where: { id, tenantId },
      data,
    });
    if (result.count === 0) return null;
    return db.complianceStepTemplate.findFirst({ where: { id, tenantId } });
  },

  async softDeleteTemplate(tenantId: string, id: string) {
    const result = await db.complianceTemplate.updateMany({
      where: { id, tenantId, deletedAt: null },
      data: { deletedAt: new Date(), isActive: false },
    });
    return result.count;
  },

  async deleteStep(tenantId: string, id: string) {
    const result = await db.complianceStepTemplate.deleteMany({
      where: { id, tenantId },
    });
    return result.count;
  },

  async listSteps(tenantId: string, templateId: string) {
    return db.complianceStepTemplate.findMany({
      where: { tenantId, templateId },
      orderBy: { stepOrder: "asc" },
    });
  },
};
