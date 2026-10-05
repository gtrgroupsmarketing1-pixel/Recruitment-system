import { ApplicationRepo } from "./application.repo";
import { transition, type Status } from "./application.state-machine";
import { eventBus } from "@/core/events/event-bus";
import { NotFoundError } from "@/lib/errors";
import type { ApplicationStatus } from "@prisma/client";

/**
 * Application business logic. Only writer of CandidateApplication.status.
 */
export const ApplicationService = {
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
