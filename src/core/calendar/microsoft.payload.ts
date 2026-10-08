import type { CreateEventInput } from "./calendar.client";

export function buildMicrosoftEventRequest(input: CreateEventInput) {
  return {
    subject: input.title,
    body: {
      contentType: "HTML",
      content: input.description ?? "",
    },
    start: {
      dateTime: input.startsAt.toISOString().replace(/\.\d{3}Z$/, ""),
      timeZone: input.timezone,
    },
    end: {
      dateTime: input.endsAt.toISOString().replace(/\.\d{3}Z$/, ""),
      timeZone: input.timezone,
    },
    attendees: input.attendees.map((a) => ({
      emailAddress: { address: a.email, name: a.name },
      type: "required",
    })),
    isOnlineMeeting: input.createMeetingLink,
    onlineMeetingProvider: input.createMeetingLink ? "teamsForBusiness" : undefined,
  };
}
