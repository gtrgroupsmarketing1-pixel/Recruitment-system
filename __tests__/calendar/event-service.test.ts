import { describe, it, expect } from "vitest";
import { ConfigurationError } from "@/lib/errors";
import { seedTenantWithCase } from "../helpers/seed";
import { withTenant } from "@/core/db/client";
import { CalendarEventService } from "@/modules/calendar/calendar.event.service";

const hasDb = Boolean(process.env.DATABASE_URL && process.env.AUTH_DATABASE_URL);

describe.skipIf(!hasDb)("CalendarEventService", () => {
  it("throws ConfigurationError without calendar connection", async () => {
    const seed = await seedTenantWithCase();
    await expect(
      withTenant(seed.tenantId, () =>
        CalendarEventService.scheduleInterview(seed.tenantId, seed.recruiterId, {
          applicationId: seed.applicationId,
          startsAt: new Date(Date.now() + 86_400_000),
          endsAt: new Date(Date.now() + 86_400_000 + 30 * 60_000),
          timezone: "UTC",
          attendees: [{ name: "C", email: "c@t.com" }],
        })
      )
    ).rejects.toBeInstanceOf(ConfigurationError);
  });
});
