import { authPrisma, runInTenantTx } from "@/core/db/client";
import { eventBus } from "@/core/events/event-bus";
import { NotFoundError, ValidationError } from "@/lib/errors";
import type { CandidateScope } from "@/core/candidate-auth/scope";

export const CandidateAppointmentService = {
  async listUpcoming(scope: CandidateScope) {
    const apps = await authPrisma.candidateApplication.findMany({
      where: { tenantId: scope.tenantId, candidateId: scope.candidateId, deletedAt: null },
      select: { id: true },
    });
    return authPrisma.scheduledEvent.findMany({
      where: {
        tenantId: scope.tenantId,
        applicationId: { in: apps.map((a) => a.id) },
        startsAt: { gte: new Date() },
        status: { not: "CANCELLED" },
      },
      orderBy: { startsAt: "asc" },
    });
  },

  async respond(scope: CandidateScope, eventId: string, response: "CONFIRMED" | "DECLINED", reason: string | null) {
    if (response === "DECLINED" && !reason) throw new ValidationError("Decline requires a reason");
    const event = await authPrisma.scheduledEvent.findFirst({
      where: { id: eventId, tenantId: scope.tenantId },
      include: { application: true },
    });
    if (!event || event.application?.candidateId !== scope.candidateId) {
      throw new NotFoundError("ScheduledEvent", eventId);
    }
    await authPrisma.auditLog.create({
      data: {
        tenantId: scope.tenantId,
        entity: "ScheduledEvent",
        entityId: eventId,
        field: "appointment_response",
        newValue: response,
      },
    });
    await runInTenantTx(scope.tenantId, () => eventBus.publish({
      type: "candidate.appointment_response",
      tenantId: scope.tenantId,
      payload: { eventId, candidateId: scope.candidateId, response, reason },
    }));
  },

  confirm(scope: CandidateScope, eventId: string) {
    return this.respond(scope, eventId, "CONFIRMED", null);
  },

  decline(scope: CandidateScope, eventId: string, reason: string) {
    return this.respond(scope, eventId, "DECLINED", reason);
  },
};
