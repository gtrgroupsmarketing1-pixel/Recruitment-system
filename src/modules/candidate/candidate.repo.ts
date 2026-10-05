import { db } from "@/core/db/client";

/**
 * Candidate data access. Tenant-scoped. No business logic.
 */
export const CandidateRepo = {
  async findById(tenantId: string, id: string) {
    return db.candidate.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
  },

  async list(tenantId: string) {
    return db.candidate.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
  },
};
