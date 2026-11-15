import { db } from "@/core/db/client";
import type { Prisma, ReqStatus } from "@prisma/client";
import { FILLED_STATUSES } from "@/modules/application/application.state-machine";

/**
 * Requisition data access. Tenant-scoped. No business logic.
 * Never findUnique({ where: { id } }).
 */
export const RequisitionRepo = {
  async findById(tenantId: string, id: string) {
    return db.jobRequisition.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
  },

  async list(
    tenantId: string,
    filter?: { status?: ReqStatus; clientCompanyId?: string; search?: string },
    scopeWhere?: Prisma.JobRequisitionWhereInput
  ) {
    return db.jobRequisition.findMany({
      where: {
        tenantId,
        deletedAt: null,
        ...scopeWhere,
        ...(filter?.status ? { status: filter.status } : {}),
        ...(filter?.clientCompanyId
          ? { clientCompanyId: filter.clientCompanyId }
          : {}),
        ...(filter?.search
          ? {
              OR: [
                { reqCode: { contains: filter.search, mode: "insensitive" } },
                { roleCategory: { contains: filter.search, mode: "insensitive" } },
                { location: { contains: filter.search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async create(tenantId: string, data: Prisma.JobRequisitionUncheckedCreateInput) {
    return db.jobRequisition.create({
      data: { ...data, tenantId },
    });
  },

  /** updateMany + findFirst so a wrong tenant cannot update by id alone. */
  async update(
    tenantId: string,
    id: string,
    data: Prisma.JobRequisitionUncheckedUpdateInput
  ) {
    const result = await db.jobRequisition.updateMany({
      where: { id, tenantId, deletedAt: null },
      data,
    });
    if (result.count === 0) return null;
    return db.jobRequisition.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
  },

  async findMaxSeqForPrefix(
    tenantId: string,
    clientCompanyId: string,
    prefix: string
  ): Promise<number> {
    const rows = await db.jobRequisition.findMany({
      where: {
        tenantId,
        clientCompanyId,
        reqCode: { startsWith: prefix + "-" },
      },
      select: { reqCode: true },
    });
    let max = 0;
    for (const row of rows) {
      const tail = row.reqCode.slice(prefix.length + 1);
      const n = Number.parseInt(tail, 10);
      if (Number.isFinite(n) && n > max) max = n;
    }
    return max;
  },

  async countMobilized(tenantId: string, requisitionId: string): Promise<number> {
    return db.candidateApplication.count({
      where: {
        tenantId,
        requisitionId,
        deletedAt: null,
        status: { in: [...FILLED_STATUSES] },
      },
    });
  },

  async findClient(tenantId: string, id: string) {
    return db.clientCompany.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: { id: true, name: true, code: true },
    });
  },

  async findUser(tenantId: string, id: string) {
    return db.user.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: { id: true, name: true, role: true },
    });
  },

  async softDelete(tenantId: string, id: string) {
    const result = await db.jobRequisition.updateMany({
      where: { id, tenantId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    return result.count > 0;
  },
};
