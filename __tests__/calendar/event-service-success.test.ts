import { describe, it, expect, afterEach } from "vitest";
import { authPrisma, withTenant, db } from "@/core/db/client";
import { seedTenantWithCase } from "../helpers/seed";
import { CalendarEventService } from "@/modules/calendar/calendar.event.service";
import {
  setCalendarClientForTesting,
} from "@/modules/calendar/calendar.provider";
import type { ExternalCalendarClient } from "@/core/calendar/calendar.client";
import { registerSubscribers, resetSubscriberRegistration } from "@/core/events/register-subscribers";
import { eventBus } from "@/core/events/event-bus";

const hasDb = Boolean(process.env.DATABASE_URL && process.env.AUTH_DATABASE_URL);

function mockClient(success: boolean): ExternalCalendarClient {
  return {
    async getFreeBusy() {
      return [];
    },
    async createEvent() {
      if (!success) throw new Error("create_failed");
      return {
        externalEventId: "g-123",
        meetingUrl: "https://meet.google.com/abc",
      };
    },
    async cancelEvent() {},
  };
}

describe.skipIf(!hasDb)("CalendarEventService success path", () => {
  afterEach(() => {
    setCalendarClientForTesting(null);
  });

  it("CONFIRMED with meeting URL when client succeeds", async () => {
    resetSubscriberRegistration();
    registerSubscribers();
    const seed = await seedTenantWithCase();

    await withTenant(seed.tenantId, () =>
      db.userCalendarConnection.create({
        data: {
          tenantId: seed.tenantId,
          userId: seed.recruiterId,
          provider: "GOOGLE",
          externalAccountId: "ext-1",
          externalEmail: "recruiter@example.com",
          accessToken: "tok",
          refreshToken: "ref",
          tokenExpiresAt: new Date(Date.now() + 3600_000),
          scopes: "calendar.events",
        },
      })
    );

    setCalendarClientForTesting(mockClient(true));

    const startsAt = new Date(Date.now() + 86_400_000);
    const endsAt = new Date(startsAt.getTime() + 30 * 60_000);

    const event = await withTenant(seed.tenantId, () =>
      CalendarEventService.scheduleInterview(seed.tenantId, seed.recruiterId, {
        applicationId: seed.applicationId,
        startsAt,
        endsAt,
        timezone: "UTC",
        attendees: [{ name: "C", email: "c@t.com" }],
      })
    );

    expect(event.status).toBe("CONFIRMED");
    expect(event.externalEventId).toBe("g-123");
    expect(event.meetingUrl).toBe("https://meet.google.com/abc");
    expect(event.provider).toBe("GOOGLE");

    await eventBus.dispatchPending(seed.tenantId);
    const domainEvents = await authPrisma.domainEvent.findMany({
      where: { tenantId: seed.tenantId, type: "calendar.event_created" },
    });
    expect(domainEvents.length).toBeGreaterThanOrEqual(1);
  });
});
