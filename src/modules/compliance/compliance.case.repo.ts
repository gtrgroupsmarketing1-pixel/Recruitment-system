import { db } from "@/core/db/client";
import type { Prisma } from "@prisma/client";

export const ComplianceCaseRepo = {
  async findById(tenantId: string, id: string) {
    return db.complianceCase.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        checklists: { orderBy: { stepOrder: "asc" } },
        template: { include: { steps: { orderBy: { stepOrder: "asc" } } } },
      },
    });
  },

  async findByApplication(tenantId: string, applicationId: string) {
    return db.complianceCase.findFirst({
      where: { tenantId, applicationId, deletedAt: null },
      include: { checklists: { orderBy: { stepOrder: "asc" } } },
    });
  },

  async listCases(
    tenantId: string,
    filter?: { status?: string; requisitionId?: string }
  ) {
    return db.complianceCase.findMany({
      where: {
        tenantId,
        deletedAt: null,
        ...(filter?.status ? { status: filter.status } : {}),
        ...(filter?.requisitionId ? { requisitionId: filter.requisitionId } : {}),
      },
      orderBy: { updatedAt: "desc" },
    });
  },

  async createCase(
    tenantId: string,
    data: Omit<Prisma.ComplianceCaseUncheckedCreateInput, "tenantId">
  ) {
    return db.complianceCase.create({ data: { ...data, tenantId } });
  },

  async createChecklist(
    tenantId: string,
    data: Omit<Prisma.ChecklistInstanceUncheckedCreateInput, "tenantId">
  ) {
    return db.checklistInstance.create({ data: { ...data, tenantId } });
  },

  async updateCaseStatus(
    tenantId: string,
    id: string,
    status: string,
    currentStepId: string | null
  ) {
    const result = await db.complianceCase.updateMany({
      where: { id, tenantId, deletedAt: null },
      data: { status, currentStepId },
    });
    if (result.count === 0) return null;
    return db.complianceCase.findFirst({ where: { id, tenantId, deletedAt: null } });
  },

  async completeChecklist(
    tenantId: string,
    checklistId: string,
    userId: string,
    docs: string[]
  ) {
    const result = await db.checklistInstance.updateMany({
      where: { id: checklistId, tenantId, deletedAt: null },
      data: {
        status: "COMPLETE",
        completedAt: new Date(),
        completedBy: userId,
        documents: docs,
      },
    });
    if (result.count === 0) return null;
    return db.checklistInstance.findFirst({
      where: { id: checklistId, tenantId, deletedAt: null },
    });
  },

  async updateChecklistStatus(
    tenantId: string,
    checklistId: string,
    status: string
  ) {
    const result = await db.checklistInstance.updateMany({
      where: { id: checklistId, tenantId, deletedAt: null },
      data: {
        status,
        completedAt: status === "COMPLETE" ? new Date() : null,
        completedBy: status === "COMPLETE" ? undefined : null,
      },
    });
    if (result.count === 0) return null;
    return db.checklistInstance.findFirst({
      where: { id: checklistId, tenantId, deletedAt: null },
    });
  },
};
