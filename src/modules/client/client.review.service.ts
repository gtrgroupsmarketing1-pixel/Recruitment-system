import { db } from "@/core/db/client";
import { eventBus } from "@/core/events/event-bus";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";
import { getUserScope } from "@/core/auth/scope";
import { PIPELINE_ORDER } from "@/modules/application/application.status-order";
import { STATUS, type Status } from "@/modules/application/application.state-machine";

const REVIEWABLE_FROM = PIPELINE_ORDER.indexOf(STATUS.CLIENT_INTERVIEWED);

export const ClientReviewService = {
  async submitDecision(
    tenantId: string,
    userId: string,
    applicationId: string,
    decision: "APPROVED" | "REJECTED" | "SHORTLISTED",
    comment: string | null
  ) {
    const scope = getUserScope();
    if (scope.role !== "CLIENT_USER" || !scope.clientCompanyId) {
      throw new ForbiddenError("Client company scope required");
    }
    const app = await db.candidateApplication.findFirst({
      where: { id: applicationId, tenantId, deletedAt: null },
      include: { requisition: { select: { clientCompanyId: true } } },
    });
    if (!app) throw new NotFoundError("Application", applicationId);
    if (app.requisition.clientCompanyId !== scope.clientCompanyId) {
      throw new ForbiddenError("Application is outside client scope");
    }
    if (PIPELINE_ORDER.indexOf(app.status as Status) < REVIEWABLE_FROM) {
      throw new ValidationError("Candidate is not ready for client review");
    }
    const row = await db.clientCandidateComment.create({
      data: {
        tenantId,
        applicationId,
        clientCompanyId: scope.clientCompanyId,
        authorUserId: userId,
        decision,
        comment,
      },
    });
    await eventBus.publish({
      type: "client.candidate_decision",
      tenantId,
      payload: {
        applicationId,
        candidateId: app.candidateId,
        requisitionId: app.requisitionId,
        clientCompanyId: scope.clientCompanyId,
        decision,
        comment,
        authorUserId: userId,
      },
    });
    return row;
  },
};
