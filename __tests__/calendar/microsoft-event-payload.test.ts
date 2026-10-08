import { describe, it, expect } from "vitest";
import { buildMicrosoftEventRequest } from "@/core/calendar/microsoft.payload";

describe("microsoft event payload", () => {
  it("sets isOnlineMeeting and teams provider", () => {
    const body = buildMicrosoftEventRequest({
      title: "Interview",
      startsAt: new Date("2026-10-08T10:00:00.000Z"),
      endsAt: new Date("2026-10-08T10:30:00.000Z"),
      timezone: "Asia/Dubai",
      attendees: [{ name: "A", email: "a@b.c" }],
      createMeetingLink: true,
    });
    expect(body.isOnlineMeeting).toBe(true);
    expect(body.onlineMeetingProvider).toBe("teamsForBusiness");
  });
});
