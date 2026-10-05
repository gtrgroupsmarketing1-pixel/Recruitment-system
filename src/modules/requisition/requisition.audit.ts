import { db } from "@/core/db/client";
import type { AuditLogEntry } from "./components/RequisitionDetail";

/** Read-only audit rows for a requisition. Pages stay off Prisma. */
export async function listRequisitionAudit(
  tenantId: string,
  requisitionId: string
): Promise<AuditLogEntry[]> {
  const rows = await db.auditLog.findMany({
    where: {
      tenantId,
      entity: "CandidateApplication",
      entityId: requisitionId,
    },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      field: true,
      oldValue: true,
      newValue: true,
      createdAt: true,
    },
  });
  return rows;
}
