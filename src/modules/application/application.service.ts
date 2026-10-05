import { ApplicationRepo } from "./application.repo";
import { transition, type Status } from "./application.state-machine";
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
    _reason?: string
  ) {
    const app = await ApplicationRepo.findById(tenantId, applicationId);
    if (!app) {
      throw new NotFoundError("Application");
    }

    // Pure state machine — throws IllegalTransitionError on illegal move.
    transition(app.status as Status, toStatus as Status);

    const updated = await ApplicationRepo.updateStatus(
      tenantId,
      applicationId,
      toStatus,
      userId
    );
    if (!updated) {
      throw new NotFoundError("Application");
    }

    // Session 06: eventBus.publish({ type: "candidate.status_changed", ... })
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
