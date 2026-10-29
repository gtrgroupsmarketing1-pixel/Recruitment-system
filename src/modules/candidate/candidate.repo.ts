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
    filter?: {
      search?: string;
      nationality?: string;
      portalStatus?: string;
      page?: number;
      limit?: number;
    },
    scopeWhere?: Prisma.CandidateWhereInput
  ) {
    const page = Math.max(1, filter?.page ?? 1);
    const limit = Math.min(100, Math.max(1, filter?.limit ?? 25));
    const where: Prisma.CandidateWhereInput = {
      tenantId,
      deletedAt: null,
      ...scopeWhere,
      ...(filter?.nationality
        ? { nationality: { equals: filter.nationality, mode: "insensitive" } }
        : {}),
      ...(filter?.portalStatus
        ? { portalStatus: filter.portalStatus }
        : {}),
      ...(filter?.search
        ? {
            OR: [
              { fullName: { contains: filter.search, mode: "insensitive" } },
              { phone: { contains: filter.search, mode: "insensitive" } },
              { email: { contains: filter.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      db.candidate.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          fullName: true,
          phone: true,
          email: true,
          nationality: true,
          portalStatus: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { applications: true } },
          applications: {
            where: { deletedAt: null },
            orderBy: { updatedAt: "desc" },
            take: 1,
            select: { status: true },
          },
        },
      }),
      db.candidate.count({ where }),
    ]);

    return { rows, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
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
