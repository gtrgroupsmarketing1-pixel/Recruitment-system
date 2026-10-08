import { describe, it, expect } from "vitest";
import {
  buildGoogleEventRequest,
  googleCreateEventUrl,
} from "@/core/calendar/google.payload";

describe("google event payload", () => {
  it("builds correct shape with conferenceData", () => {
    const body = buildGoogleEventRequest({
      title: "Interview",
      description: "Desc",
      startsAt: new Date("2026-10-08T10:00:00.000Z"),
      endsAt: new Date("2026-10-08T10:30:00.000Z"),
      timezone: "Asia/Dubai",
      attendees: [{ name: "A", email: "a@b.c" }],
      createMeetingLink: true,
    });
    expect(body.summary).toBe("Interview");
    expect((body.attendees as unknown[]).length).toBe(1);
    const conf = body.conferenceData as { createRequest: { requestId: string } };
    expect(conf.createRequest.requestId).toMatch(
      /^[0-9a-f-]{36}$/i
    );
  });

  it("includes conferenceDataVersion=1 on create URL", () => {
    expect(googleCreateEventUrl()).toContain("conferenceDataVersion=1");
  });
});
