import { db } from "@/core/db/client";
import type { Prisma, ScreeningPath } from "@prisma/client";

/**
 * Screening data access. Tenant-scoped. No business logic.
 * Never findUnique({ where: { id } }) — always findFirst with tenantId + deletedAt.
 */
export const ScreeningRepo = {
  async findById(tenantId: string, id: string) {
    return db.screeningRecord.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { steps: { orderBy: { stepOrder: "asc" } }, application: true },
    });
  },

  async findByApplication(tenantId: string, applicationId: string) {
    return db.screeningRecord.findMany({
      where: { tenantId, applicationId, deletedAt: null },
      orderBy: { createdAt: "asc" },
      include: { steps: { orderBy: { stepOrder: "asc" } }, application: true },
    });
  },

  async create(
    tenantId: string,
    data: { applicationId: string; stage: string; path: ScreeningPath }
  ) {
    return db.screeningRecord.create({
      data: { ...data, tenantId },
      include: { steps: { orderBy: { stepOrder: "asc" } } },
    });
  },

  async updateStep(
    tenantId: string,
    screeningId: string,
    stepOrder: number,
    data: Prisma.ScreeningStepUncheckedUpdateInput
  ) {
    const result = await db.screeningStep.updateMany({
      where: { screeningId, tenantId, stepOrder, deletedAt: null },
      data,
    });
    if (result.count === 0) return null;
    return db.screeningStep.findFirst({
      where: { screeningId, tenantId, stepOrder, deletedAt: null },
    });
  },

  async updateScreening(
    tenantId: string,
    id: string,
    data: Prisma.ScreeningRecordUncheckedUpdateInput
  ) {
    const result = await db.screeningRecord.updateMany({
      where: { id, tenantId, deletedAt: null },
      data,
    });
    if (result.count === 0) return null;
    return db.screeningRecord.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { steps: { orderBy: { stepOrder: "asc" } } },
    });
  },
};
