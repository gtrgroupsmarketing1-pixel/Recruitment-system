import type { CalendarProvider } from "@prisma/client";
import type { ExternalCalendarClient } from "@/core/calendar/calendar.client";
import { createGoogleCalendarClient } from "@/core/calendar/google.client";
import { createMicrosoftCalendarClient } from "@/core/calendar/microsoft.client";

let testOverride: ExternalCalendarClient | null = null;

export function setCalendarClientForTesting(
  client: ExternalCalendarClient | null
): void {
  if (process.env.NODE_ENV === "production") {
    throw new Error("setCalendarClientForTesting called in production");
  }
  testOverride = client;
}

export function getCalendarClient(
  provider: CalendarProvider
): ExternalCalendarClient {
  if (testOverride) return testOverride;
  return provider === "GOOGLE"
    ? createGoogleCalendarClient()
    : createMicrosoftCalendarClient();
}
