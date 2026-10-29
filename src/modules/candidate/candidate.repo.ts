import { db } from "@/core/db/client";
import type { Prisma } from "@prisma/client";

/**
 * Candidate data access. Tenant-scoped. No business logic.
 * Sensitive fields pass through as plaintext — encryption middleware handles them.
 * Never findUnique({ where: { id } }). Never import authPrisma.
 */
export const CandidateRepo = {
  async findById(tenantId: string, id: string) {
    return db.candidate.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
  },

  async list(
    tenantId: string,
    filter?: { search?: string },
    scopeWhere?: Prisma.CandidateWhereInput
  ) {
    return db.candidate.findMany({
      where: {
        tenantId,
        deletedAt: null,
        ...scopeWhere,
        ...(filter?.search
          ? {
              OR: [
                { fullName: { contains: filter.search, mode: "insensitive" } },
                { phone: { contains: filter.search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
        nationality: true,
        portalStatus: true,
        createdAt: true,
        _count: { select: { applications: true } },
      },
    });
  },

  async create(tenantId: string, data: Prisma.CandidateUncheckedCreateInput) {
    return db.candidate.create({
      data: { ...data, tenantId },
    });
  },

  async update(
    tenantId: string,
    id: string,
    data: Prisma.CandidateUncheckedUpdateInput
  ) {
    const result = await db.candidate.updateMany({
      where: { id, tenantId, deletedAt: null },
      data,
    });
    if (result.count === 0) return null;
    return db.candidate.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
  },

  /** Middleware rewrites passportNumber filter to passportNumberBidx. */
  async findByPassport(tenantId: string, plaintext: string) {
    return db.candidate.findFirst({
      where: { tenantId, deletedAt: null, passportNumber: plaintext },
    });
  },

  /**
   * Candidates in the tenant with no application on this requisition.
   * Capped at 200. Two-query pattern (linked ids, then notIn).
   */
  async listUnlinkedForRequisition(tenantId: string, requisitionId: string) {
    const linked = await db.candidateApplication.findMany({
      where: { tenantId, requisitionId, deletedAt: null },
      select: { candidateId: true },
    });
    const linkedIds = linked.map((row) => row.candidateId);
    return db.candidate.findMany({
      where: {
        tenantId,
        deletedAt: null,
        ...(linkedIds.length > 0 ? { id: { notIn: linkedIds } } : {}),
      },
      take: 200,
      orderBy: { createdAt: "desc" },
      select: { id: true, fullName: true, phone: true },
    });
  },

  async softDelete(tenantId: string, id: string) {
    const result = await db.candidate.updateMany({
      where: { id, tenantId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    return result.count > 0;
  },
};
