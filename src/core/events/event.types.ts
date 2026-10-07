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
};

export type DomainEventType = keyof DomainEventPayloads;

export type DomainEvent<T extends DomainEventType = DomainEventType> = {
  type: T;
  tenantId: string;
  payload: DomainEventPayloads[T];
};
