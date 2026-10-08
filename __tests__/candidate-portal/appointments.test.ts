import { describe, expect, it } from "vitest";
import { authPrisma } from "@/core/db/client";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { seedTenantWithCase } from "../helpers/seed";
import { CandidateAppointmentService } from "@/modules/candidate-portal/appointment.service";

describe("candidate appointments", () => {
  it("confirms own events, requires a decline reason, and hides others", async () => {
    const seed = await seedTenantWithCase();
    const stamp = Date.now();
    const event = await authPrisma.scheduledEvent.create({
      data: {
        id: `ev-${stamp}`,
        tenantId: seed.tenantId,
        applicationId: seed.applicationId,
        type: "MEDICAL",
        title: "Medical",
        startsAt: new Date(Date.now() + 86_400_000),
        endsAt: new Date(Date.now() + 90_000_000),
        timezone: "Asia/Dubai",
        organizerUserId: seed.recruiterId,
        attendees: [],
      },
    });
    const scope = { kind: "CANDIDATE" as const, tenantId: seed.tenantId, candidateId: seed.candidateId };
    await CandidateAppointmentService.confirm(scope, event.id);
    const log = await authPrisma.auditLog.findFirst({
      where: { tenantId: seed.tenantId, entity: "ScheduledEvent", entityId: event.id },
    });
    expect(log?.newValue).toBe("CONFIRMED");
    const published = await authPrisma.domainEvent.findFirst({
      where: { tenantId: seed.tenantId, type: "candidate.appointment_response" },
    });
    expect(published).toBeTruthy();
    await expect(CandidateAppointmentService.decline(scope, event.id, "")).rejects.toBeInstanceOf(ValidationError);
    await expect(CandidateAppointmentService.confirm(scope, "missing")).rejects.toBeInstanceOf(NotFoundError);
  });
});
