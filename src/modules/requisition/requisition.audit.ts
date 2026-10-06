import { db } from "@/core/db/client";
import type { AuditLogEntry } from "./components/RequisitionDetail";

/**
 * Read-only audit rows for applications on a requisition.
 * Session 07 writes entityId = applicationId, not requisitionId.
 * Caller wraps withTenant.
 */
export async function listRequisitionAudit(
  tenantId: string,
  requisitionId: string,
  limit = 20
): Promise<AuditLogEntry[]> {
  const apps = await db.candidateApplication.findMany({
    where: { tenantId, requisitionId, deletedAt: null },
    select: { id: true },
  });
  const appIds = apps.map((a) => a.id);
  if (appIds.length === 0) return [];

  return db.auditLog.findMany({
    where: {
      tenantId,
      entity: "CandidateApplication",
      entityId: { in: appIds },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      field: true,
      oldValue: true,
      newValue: true,
      createdAt: true,
    },
  });
}
