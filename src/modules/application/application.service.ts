import { ApplicationRepo } from "./application.repo";
import { transition, type Status } from "./application.state-machine";
import { eventBus } from "@/core/events/event-bus";
import { db } from "@/core/db/client";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import type { ApplicationStatus, ScreeningPath } from "@prisma/client";
import { CandidateRepo } from "@/modules/candidate/candidate.repo";
import { RequisitionRepo } from "@/modules/requisition/requisition.repo";
import type { CreateApplicationInput } from "./application.schema";
import { ScreeningRepo } from "@/modules/screening/screening.repo";
import { ScreeningService } from "@/modules/screening/screening.service";
import { tryGetScope } from "@/core/auth/scope";
import {
  applicationScopeFilter,
  loadBranchUserIds,
} from "@/core/auth/scope-filter";

/**
 * Application business logic. Only writer of CandidateApplication.status.
 */

async function resolveAppScopeWhere(tenantId: string) {
  const scope = tryGetScope();
  let branchUserIds: string[] | undefined;
  if (scope?.kind === "USER" && scope.role === "BRANCH_MANAGER" && scope.branchId) {
    branchUserIds = await loadBranchUserIds(tenantId, scope.branchId);
  }
  return scope ? applicationScopeFilter(scope, branchUserIds) : {};
}

export const ApplicationService = {
  async create(tenantId: string, userId: string, input: CreateApplicationInput) {
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
    const path = input.path ?? "BLUE_COLLAR";

    // NO db.$transaction HERE! The calling server action (withSessionScope) handles it.
    const app = await ApplicationRepo.create(tenantId, {
      candidateId: input.candidateId,
      requisitionId: input.requisitionId,
      recruiterId: input.recruiterId,
    });

    try {
      await ScreeningService.startScreening(tenantId, userId, app.id, path);
    } catch (err) {
      // Screening tables/enum may lag production schema — do not block linking.
      console.error("[application.create] startScreening failed", err);
    }

    return app;
  },

  async listByCandidate(tenantId: string, candidateId: string) {
    const scopeWhere = await resolveAppScopeWhere(tenantId);
    return ApplicationRepo.listByCandidate(tenantId, candidateId, scopeWhere);
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

    if (toStatus === "SHORTLISTED") {
      const screenings = await ScreeningRepo.findByApplication(tenantId, applicationId);
      const passed = screenings.some((s) => s.outcome === "PASSED");
      if (!passed) {
        throw new ValidationError(
          "Application must pass screening before shortlisting"
        );
      }
    }

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
    const scopeWhere = await resolveAppScopeWhere(tenantId);
    return ApplicationRepo.listByRequisition(tenantId, requisitionId, scopeWhere);
  },
};