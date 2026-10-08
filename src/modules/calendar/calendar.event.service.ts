import type { CalendarProvider, Prisma } from "@prisma/client";
import { db } from "@/core/db/client";
import { eventBus } from "@/core/events/event-bus";
import {
  ConfigurationError,
  NotFoundError,
  ValidationError,
} from "@/lib/errors";
import type { TimeWindow } from "@/core/calendar/calendar.client";
import { CalendarConnectionService } from "./calendar.connection.service";

function asJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? null)) as Prisma.InputJsonValue;
}

export type ScheduledEventView = {
  id: string;
  type: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
  timezone: string;
  status: string;
  meetingUrl: string | null;
  provider: CalendarProvider | null;
};

export const CalendarEventService = {
  async scheduleInterview(
    tenantId: string,
    organizerUserId: string,
    input: {
      applicationId: string;
      startsAt: Date;
      endsAt: Date;
      timezone: string;
      title?: string;
      description?: string;
      attendees: Array<{ name: string; email: string }>;
      provider?: CalendarProvider;
    }
  ) {
    const application = await db.candidateApplication.findFirst({
      where: { id: input.applicationId, tenantId, deletedAt: null },
    });
    if (!application) throw new NotFoundError("CandidateApplication", input.applicationId);

    const provider = input.provider ?? "GOOGLE";
    const connections = await CalendarConnectionService.list(tenantId, organizerUserId);
    const conn =
      connections.find((c) => c.provider === provider) ?? connections[0];
    if (!conn) {
      throw new ConfigurationError(
        "No calendar connected. Connect Google or Microsoft at /settings/calendar."
      );
    }

    const title = input.title ?? "Interview";
    const row = await db.scheduledEvent.create({
      data: {
        tenantId,
        applicationId: input.applicationId,
        type: "INTERVIEW",
        title,
        description: input.description ?? null,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        timezone: input.timezone,
        organizerUserId,
        provider: conn.provider,
        attendees: asJson(input.attendees),
        status: "PENDING",
      },
    });

    try {
      const { client, accessToken } =
        await CalendarConnectionService.getAuthorizedClient(
          tenantId,
          organizerUserId,
          conn.provider
        );
      const created = await client.createEvent(accessToken, {
        title,
        description: input.description,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        timezone: input.timezone,
        attendees: input.attendees,
        createMeetingLink: true,
      });

      const updated = await db.scheduledEvent.update({
        where: { id: row.id },
        data: {
          externalEventId: created.externalEventId,
          meetingUrl: created.meetingUrl,
          status: "CONFIRMED",
        },
      });

      await eventBus.publish({
        type: "calendar.event_created",
        tenantId,
        payload: {
          eventId: updated.id,
          applicationId: input.applicationId,
          organizerUserId,
          startsAt: input.startsAt.toISOString(),
          meetingUrl: created.meetingUrl,
        },
      });

      return updated;
    } catch (err) {
      await db.scheduledEvent.update({
        where: { id: row.id },
        data: { status: "FAILED" },
      });
      throw err instanceof Error ? err : new ValidationError(String(err));
    }
  },

  async cancelEvent(
    tenantId: string,
    userId: string,
    eventId: string,
    reason: string
  ) {
    const row = await db.scheduledEvent.findFirst({
      where: { id: eventId, tenantId },
    });
    if (!row) throw new NotFoundError("ScheduledEvent", eventId);
    if (row.status === "CANCELLED") return row;

    if (row.provider && row.externalEventId) {
      const { client, accessToken } =
        await CalendarConnectionService.getAuthorizedClient(
          tenantId,
          userId,
          row.provider
        );
      await client.cancelEvent(accessToken, row.externalEventId);
    }

    const updated = await db.scheduledEvent.update({
      where: { id: row.id },
      data: { status: "CANCELLED", cancellationReason: reason },
    });

    await eventBus.publish({
      type: "calendar.event_cancelled",
      tenantId,
      payload: {
        eventId: updated.id,
        applicationId: row.applicationId,
        reason,
      },
    });

    return updated;
  },

  async getAvailability(
    tenantId: string,
    organizerUserId: string,
    window: TimeWindow,
    provider?: CalendarProvider
  ) {
    const connections = await CalendarConnectionService.list(
      tenantId,
      organizerUserId
    );
    const conn =
      (provider
        ? connections.find((c) => c.provider === provider)
        : undefined) ?? connections[0];
    if (!conn) {
      throw new ConfigurationError("No calendar connected");
    }
    const { client, accessToken } =
      await CalendarConnectionService.getAuthorizedClient(
        tenantId,
        organizerUserId,
        conn.provider
      );
    return client.getFreeBusy(accessToken, window, [conn.externalEmail]);
  },

  async listForApplication(tenantId: string, applicationId: string) {
    return db.scheduledEvent.findMany({
      where: { tenantId, applicationId },
      orderBy: { startsAt: "asc" },
    });
  },
};
