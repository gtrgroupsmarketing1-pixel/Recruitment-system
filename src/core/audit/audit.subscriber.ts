/**
 * Audit subscriber for candidate.status_changed.
 *
 * Writes AuditLog after the DomainEvent commits (outbox dispatch), not inside
 * the status-change transaction. A failed audit write leaves dispatchedAt null
 * so the dispatcher retries. Eventual consistency for the audit log, with
 * durable intent on DomainEvent.
 *
 * Errors propagate — the dispatcher catches per subscriber, logs, and leaves
 * the row pending. This handler does not swallow.
 */
import { eventBus } from "@/core/events/event-bus";
import { db } from "@/core/db/client";

export function registerAuditSubscriber(): () => void {
  return eventBus.subscribe("candidate.status_changed", async (event) => {
    await db.auditLog.create({
      data: {
        tenantId: event.tenantId,
        userId: event.payload.actorId,
        entity: "CandidateApplication",
        entityId: event.payload.applicationId,
        field: "status",
        oldValue: event.payload.from,
        newValue: event.payload.to,
      },
    });
  });
}
