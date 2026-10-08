import { randomUUID } from "node:crypto";
import type { CreateEventInput } from "./calendar.client";

export function buildGoogleEventRequest(input: CreateEventInput) {
  const body: Record<string, unknown> = {
    summary: input.title,
    description: input.description ?? "",
    start: {
      dateTime: input.startsAt.toISOString(),
      timeZone: input.timezone,
    },
    end: {
      dateTime: input.endsAt.toISOString(),
      timeZone: input.timezone,
    },
    attendees: input.attendees.map((a) => ({
      email: a.email,
      displayName: a.name,
    })),
  };
  if (input.createMeetingLink) {
    body.conferenceData = {
      createRequest: { requestId: randomUUID() },
    };
  }
  return body;
}

export function googleCreateEventUrl(): string {
  return "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1";
}
