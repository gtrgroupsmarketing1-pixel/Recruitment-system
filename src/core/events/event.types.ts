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
  // future events: Sessions 07, 12, 13, 18, 19...
};

export type DomainEventType = keyof DomainEventPayloads;

export type DomainEvent<T extends DomainEventType = DomainEventType> = {
  type: T;
  tenantId: string;
  payload: DomainEventPayloads[T];
};
