import { db } from "@/core/db/client";
import type { Prisma } from "@prisma/client";

/**
 * Requisition data access. Tenant-scoped. No business logic.
 */
export const RequisitionRepo = {
  async findById(tenantId: string, id: string) {
    return db.jobRequisition.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
  },

  async list(tenantId: string, filter?: { status?: string }) {
    return db.jobRequisition.findMany({
      where: {
        tenantId,
        deletedAt: null,
        ...(filter?.status ? { status: filter.status } : {}),
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async create(
    tenantId: string,
    data: Omit<Prisma.JobRequisitionCreateInput, "tenant">
  ) {
    return db.jobRequisition.create({
      data: { ...data, tenantId },
    });
  },
};
