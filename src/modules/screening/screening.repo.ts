import { db } from "@/core/db/client";

/**
 * Screening data access. Tenant-scoped. No business logic.
 */
export const ScreeningRepo = {
  async findByApplication(tenantId: string, applicationId: string) {
    return db.screeningRecord.findMany({
      where: { tenantId, applicationId, deletedAt: null },
      orderBy: { createdAt: "asc" },
    });
  },
};
