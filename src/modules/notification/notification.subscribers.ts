import { eventBus } from "@/core/events/event-bus";
import { db } from "@/core/db/client";
import { NotificationService } from "./notification.service";
import { resolveChannel } from "@/core/notifications/channel-resolver";

/**
 * Notification subscribers. Register once at boot.
 * External sends run inside the outbox dispatch tx; failures leave
 * DomainEvent.dispatchedAt null for retry (Session 06 outbox contract).
 */
export function registerNotificationSubscribers(): () => void {
  const unsubClient = eventBus.subscribe("client.candidate_decision", async (event) => {
    const app = await db.candidateApplication.findFirst({
      where: { id: event.payload.applicationId, tenantId: event.tenantId },
      select: { recruiterId: true },
    });
    if (!app?.recruiterId) return;
    const user = await db.user.findFirst({
      where: { id: app.recruiterId, tenantId: event.tenantId },
      select: { email: true },
    });
    if (!user?.email) return;
    await NotificationService.send(
      event.tenantId,
      "client.candidate_decision",
      { type: "USER", id: app.recruiterId, addr: user.email },
      { decision: event.payload.decision, applicationId: event.payload.applicationId }
    );
  });
  const unsubOrder = eventBus.subscribe("joborder.submitted", async (event) => {
    const admins = await db.user.findMany({
      where: { tenantId: event.tenantId, role: "TENANT_ADMIN", deletedAt: null },
      select: { id: true, email: true },
      take: 5,
    });
    for (const admin of admins) {
      await NotificationService.send(
        event.tenantId,
        "joborder.submitted",
        { type: "USER", id: admin.id, addr: admin.email },
        { roleTitle: event.payload.roleTitle }
      );
    }
  });
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

    const resolved = await resolveChannel(event.tenantId, {
      candidateId: event.payload.candidateId,
    });
    if (!resolved) return;

    await NotificationService.send(
      event.tenantId,
      "candidate.status_changed",
      {
        type: "CANDIDATE",
        id: event.payload.candidateId,
        addr: resolved.address,
      },
      {
        candidateName: candidate.fullName,
        status: event.payload.to,
        requisitionCode: event.payload.requisitionId,
      },
      { channel: resolved.channel }
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
    unsubClient();
    unsubOrder();

    unsub1();
    unsub2();
    unsub3();
    unsub4();
  };
}
