import { ApplicationRepo } from "./application.repo";
import { transition, type Status } from "./application.state-machine";
import { eventBus } from "@/core/events/event-bus";
import { ConflictError, NotFoundError } from "@/lib/errors";
import type { ApplicationStatus } from "@prisma/client";
import { CandidateRepo } from "@/modules/candidate/candidate.repo";
import { RequisitionRepo } from "@/modules/requisition/requisition.repo";
import type { CreateApplicationInput } from "./application.schema";

/**
 * Application business logic. Only writer of CandidateApplication.status.
 */
export const ApplicationService = {
  async create(tenantId: string, userId: string, input: CreateApplicationInput) {
    void userId;
    const candidate = await CandidateRepo.findById(tenantId, input.candidateId);
    if (!candidate) throw new NotFoundError("Candidate", input.candidateId);
    const requisition = await RequisitionRepo.findById(tenantId, input.requisitionId);
    if (!requisition) throw new NotFoundError("JobRequisition", input.requisitionId);
    const existing = await ApplicationRepo.findByCandidateAndRequisition(
      tenantId,
      input.candidateId,
      input.requisitionId
    );
    if (existing) {
      throw new ConflictError("Candidate already linked to this requisition");
    }
    // SOURCED is the initial state, not a transition. No event publish.
    return ApplicationRepo.create(tenantId, {
      candidateId: input.candidateId,
      requisitionId: input.requisitionId,
      recruiterId: input.recruiterId,
    });
  },

  async listByCandidate(tenantId: string, candidateId: string) {
    return ApplicationRepo.listByCandidate(tenantId, candidateId);
  },

  async changeStatus(
    tenantId: string,
    userId: string,
    applicationId: string,
    toStatus: ApplicationStatus,
    reason?: string
  ) {
    const app = await ApplicationRepo.findById(tenantId, applicationId);
    if (!app) {
      throw new NotFoundError("Application");
    }

    const fromStatus = app.status;

    // Pure state machine — throws IllegalTransitionError on illegal move.
    transition(fromStatus as Status, toStatus as Status);

    const updated = await ApplicationRepo.updateStatus(
      tenantId,
      applicationId,
      toStatus,
      userId
    );
    if (!updated) {
      throw new NotFoundError("Application");
    }

    await eventBus.publish({
      type: "candidate.status_changed",
      tenantId,
      payload: {
        applicationId,
        candidateId: app.candidateId,
        requisitionId: app.requisitionId,
        from: fromStatus,
        to: toStatus,
        actorId: userId,
        reason,
      },
    });

    return updated;
  },

  async getById(tenantId: string, id: string) {
    const app = await ApplicationRepo.findById(tenantId, id);
    if (!app) {
      throw new NotFoundError("Application");
    }
    return app;
  },

  async listByRequisition(tenantId: string, requisitionId: string) {
    return ApplicationRepo.listByRequisition(tenantId, requisitionId);
  },
};
