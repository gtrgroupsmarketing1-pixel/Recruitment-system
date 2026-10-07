import { eventBus } from "@/core/events/event-bus";
import { db } from "@/core/db/client";

export function registerComplianceAuditSubscriber(): () => void {
  const unsubStepCompleted = eventBus.subscribe("compliance.step_completed", async (event) => {
    await db.auditLog.create({
      data: {
        tenantId: event.tenantId,
        userId: event.payload.actorId,
        entity: "ChecklistInstance",
        entityId: event.payload.checklistId,
        field: "status",
        oldValue: "PENDING",
        newValue: "COMPLETE",
      },
    });
  });
  const unsubStepReopened = eventBus.subscribe("compliance.step_reopened", async (event) => {
    await db.auditLog.create({
      data: {
        tenantId: event.tenantId,
        userId: event.payload.actorId,
        entity: "ChecklistInstance",
        entityId: event.payload.checklistId,
        field: "status",
        oldValue: "COMPLETE",
        newValue: "PENDING",
      },
    });
  });
  const unsubCaseCompleted = eventBus.subscribe("compliance.case_completed", async (event) => {
    await db.auditLog.create({
      data: {
        tenantId: event.tenantId,
        userId: null,
        entity: "ComplianceCase",
        entityId: event.payload.caseId,
        field: "status",
        oldValue: "IN_PROGRESS",
        newValue: "COMPLETE",
      },
    });
  });
  return () => {
    unsubStepCompleted();
    unsubStepReopened();
    unsubCaseCompleted();
  };
}
