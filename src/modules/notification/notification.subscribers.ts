import { eventBus } from "@/core/events/event-bus";
import { db } from "@/core/db/client";
import { NotificationService } from "./notification.service";

/**
 * Notification subscribers. Register once at boot.
 * External sends run inside the outbox dispatch tx; failures leave
 * DomainEvent.dispatchedAt null for retry (Session 06 outbox contract).
 */
export function registerNotificationSubscribers(): () => void {
  const unsub1 = eventBus.subscribe("candidate.status_changed", async (event) => {
    const candidate = await db.candidate.findFirst({
      where: {
        tenantId: event.tenantId,
        id: event.payload.candidateId,
        deletedAt: null,
      },
      select: { fullName: true, phone: true, email: true },
    });
    if (!candidate) return;

    const addr = candidate.phone ?? candidate.email;
    if (!addr) return;

    await NotificationService.send(
      event.tenantId,
      "candidate.status_changed",
      {
        type: "CANDIDATE",
        id: event.payload.candidateId,
        addr,
      },
      {
        candidateName: candidate.fullName,
        status: event.payload.to,
        requisitionCode: event.payload.requisitionId,
      }
    );
  });

  const unsub2 = eventBus.subscribe("document.expiring", async (event) => {
    const doc = await db.document.findFirst({
      where: {
        tenantId: event.tenantId,
        id: event.payload.documentId,
        deletedAt: null,
      },
      select: {
        label: true,
        type: true,
        uploadedBy: true,
        candidate: { select: { fullName: true } },
      },
    });
    if (!doc) return;

    const uploader = await db.user.findFirst({
      where: {
        tenantId: event.tenantId,
        id: doc.uploadedBy,
        deletedAt: null,
      },
      select: { email: true },
    });
    if (!uploader?.email) return;

    await NotificationService.send(
      event.tenantId,
      "document.expiring",
      {
        type: "USER",
        id: doc.uploadedBy,
        addr: uploader.email,
      },
      {
        documentLabel: doc.label || doc.type,
        candidateName: doc.candidate?.fullName ?? "Unknown",
        expiresOn: event.payload.expiresOn,
        daysRemaining: event.payload.daysRemaining,
      }
    );
  });

  const unsub3 = eventBus.subscribe("task.overdue", async (event) => {
    const task = await db.task.findFirst({
      where: {
        tenantId: event.tenantId,
        id: event.payload.taskId,
        deletedAt: null,
      },
      select: {
        title: true,
        refType: true,
        refId: true,
        assignee: { select: { id: true, email: true } },
      },
    });
    if (!task?.assignee?.email) return;

    await NotificationService.send(
      event.tenantId,
      "task.overdue",
      {
        type: "USER",
        id: task.assignee.id,
        addr: task.assignee.email,
      },
      {
        taskTitle: task.title,
        dueDate: event.payload.dueDate,
        refType: task.refType,
        refId: task.refId,
      }
    );
  });


  const unsub4 = eventBus.subscribe("compliance.connector_status_changed", async (event) => {
    const officers = await db.user.findMany({
      where: {
        tenantId: event.tenantId,
        role: "COMPLIANCE_OFFICER",
        deletedAt: null,
      },
      select: { id: true, email: true, name: true },
    });

    const checklist = await db.checklistInstance.findFirst({
      where: { tenantId: event.tenantId, id: event.payload.checklistId },
      select: { name: true, caseId: true },
    });

    for (const officer of officers) {
      if (!officer.email) continue;
      await NotificationService.send(
        event.tenantId,
        "compliance.connector_status_changed",
        { type: "USER", id: officer.id, addr: officer.email },
        {
          officerName: officer.name,
          stepName: checklist?.name ?? "Unknown",
          connectorName: event.payload.connectorId,
          previousStatus: event.payload.previousStatus,
          newStatus: event.payload.newStatus,
          suggestedAction: event.payload.suggestedAction ?? "review the case",
        },
        { channel: "EMAIL" }
      );
    }
  });

  return () => {

    unsub1();
    unsub2();
    unsub3();
    unsub4();
  };
}
