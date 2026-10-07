import { db } from "@/core/db/client";
import type { Prisma, TaskStatus } from "@prisma/client";

export const TaskRepo = {
  async findById(tenantId: string, id: string) {
    return db.task.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
  },

  async listForUser(
    tenantId: string,
    userId: string,
    filter?: { status?: TaskStatus; includeCompleted?: boolean }
  ) {
    return db.task.findMany({
      where: {
        tenantId,
        assigneeId: userId,
        deletedAt: null,
        ...(filter?.status ? { status: filter.status } : {}),
        ...(!filter?.includeCompleted && !filter?.status
          ? { status: { notIn: ["COMPLETED", "CANCELLED"] } }
          : {}),
      },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    });
  },

  async listOverdue(tenantId: string, asOf: Date) {
    return db.task.findMany({
      where: {
        tenantId,
        deletedAt: null,
        status: "OPEN",
        dueDate: { lt: asOf },
      },
      orderBy: { dueDate: "asc" },
    });
  },

  async create(tenantId: string, data: Prisma.TaskUncheckedCreateInput) {
    return db.task.create({
      data: { ...data, tenantId },
    });
  },

  async update(
    tenantId: string,
    id: string,
    data: Prisma.TaskUncheckedUpdateInput
  ) {
    const result = await db.task.updateMany({
      where: { id, tenantId, deletedAt: null },
      data,
    });
    if (result.count === 0) return null;
    return db.task.findFirst({ where: { id, tenantId, deletedAt: null } });
  },

  async countsByStatus(tenantId: string, userId: string) {
    const rows = await db.task.groupBy({
      by: ["status"],
      where: { tenantId, assigneeId: userId, deletedAt: null },
      _count: { _all: true },
    });
    const map: Record<string, number> = {};
    for (const row of rows) {
      map[row.status] = row._count._all;
    }
    return map;
  },
};
