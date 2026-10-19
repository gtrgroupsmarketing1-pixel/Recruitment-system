import { db } from "@/core/db/client";

export const ClientCompanyService = {
  async list(tenantId: string) {
    return db.clientCompany.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { name: "asc" },
    });
  },
  
  async create(tenantId: string, data: { name: string; code: string; country?: string }) {
    return db.clientCompany.create({
      data: {
        ...data,
        tenantId,
      },
    });
  }
};