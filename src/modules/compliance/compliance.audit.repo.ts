import { db } from "@/core/db/client";

export async function listCaseAudit(tenantId: string, caseId: string, limit: number) {
  const checklists = await db.checklistInstance.findMany({
    where: { tenantId, caseId, deletedAt: null },
    select: { id: true },
  });
  const ids = [caseId, ...checklists.map((c) => c.id)];
  return db.auditLog.findMany({
    where: { tenantId, entityId: { in: ids } },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      field: true,
      oldValue: true,
      newValue: true,
      createdAt: true,
      entity: true,
      entityId: true,
    },
  });
}
