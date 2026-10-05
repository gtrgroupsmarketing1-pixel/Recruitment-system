import { db } from "@/core/db/client";
import type { ApplicationStatus } from "@prisma/client";

/**
 * Application data access. Tenant-scoped. No business logic.
 * changeStatus is the only writer of CandidateApplication.status (via updateStatus).
 */
export const ApplicationRepo = {
  async findById(tenantId: string, id: string) {
    return db.candidateApplication.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
  },

  async listByRequisition(tenantId: string, requisitionId: string) {
    return db.candidateApplication.findMany({
      where: { tenantId, requisitionId, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
  },

  /** Writes ONLY status (and updatedAt via Prisma). */
  async updateStatus(
    tenantId: string,
    applicationId: string,
    toStatus: ApplicationStatus,
    _actorId: string
  ) {
    // Prefer updateMany with tenant filter so a wrong tenant cannot update by id alone.
    const result = await db.candidateApplication.updateMany({
      where: { id: applicationId, tenantId, deletedAt: null },
      data: { status: toStatus },
    });
    if (result.count === 0) {
      return null;
    }
    return db.candidateApplication.findFirst({
      where: { id: applicationId, tenantId, deletedAt: null },
    });
  },
};
