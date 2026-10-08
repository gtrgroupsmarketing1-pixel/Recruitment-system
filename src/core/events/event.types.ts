import type { ApplicationStatus } from "@prisma/client";

export type DomainEventPayloads = {
  "candidate.status_changed": {
    applicationId: string;
    candidateId: string;
    requisitionId: string;
    from: ApplicationStatus;
    to: ApplicationStatus;
    actorId: string;
    reason?: string;
  };
  "compliance.step_completed": {
    caseId: string;
    checklistId: string;
    applicationId: string;
    stepName: string;
    actorId: string;
  };
  "compliance.step_reopened": {
    caseId: string;
    checklistId: string;
    applicationId: string;
    stepName: string;
    actorId: string;
    reason: string;
  };
  "compliance.case_completed": {
    caseId: string;
    applicationId: string;
    templateName: string;
  };
  "document.expiring": {
    documentId: string;
    candidateId: string | null;
    type: string;
    expiresOn: string;
    daysRemaining: number;
  };
  "task.overdue": {
    taskId: string;
    dueDate: string;
    daysOverdue: number;
    assigneeId: string | null;
  };
  "compliance.connector_status_changed": {
    caseId: string;
    checklistId: string;
    connectorId: string;
    trackingId: string;
    previousStatus: string;
    newStatus: string;
    suggestedAction: "COMPLETE_STEP" | "REVIEW" | null;
  };
  "calendar.event_created": {
    eventId: string;
    applicationId: string | null;
    organizerUserId: string;
    startsAt: string;
    meetingUrl: string | null;
  };
  "calendar.event_cancelled": {
    eventId: string;
    applicationId: string | null;
    reason: string;
  };
  "client.candidate_decision": {
    applicationId: string;
    candidateId: string;
    requisitionId: string;
    clientCompanyId: string;
    decision: "APPROVED" | "REJECTED" | "SHORTLISTED";
    comment: string | null;
    authorUserId: string;
  };
  "joborder.submitted": {
    jobOrderId: string;
    clientCompanyId: string;
    roleTitle: string;
    submittedBy: string;
  };
};

export type DomainEventType = keyof DomainEventPayloads;

export type DomainEvent<T extends DomainEventType = DomainEventType> = {
  type: T;
  tenantId: string;
  payload: DomainEventPayloads[T];
};
