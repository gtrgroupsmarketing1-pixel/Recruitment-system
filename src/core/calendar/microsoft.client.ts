import type {
  ExternalCalendarClient,
  TimeWindow,
  FreeBusySlot,
  CreateEventInput,
  CreatedEvent,
} from "./calendar.client";
import { buildMicrosoftEventRequest } from "./microsoft.payload";

export function createMicrosoftCalendarClient(): ExternalCalendarClient {
  return {
    async getFreeBusy(accessToken, window, calendarIds): Promise<FreeBusySlot[]> {
      const email = calendarIds?.[0] ?? "me";
      const res = await fetch("https://graph.microsoft.com/v1.0/me/calendar/getSchedule", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          schedules: [email],
          startTime: {
            dateTime: window.start.toISOString(),
            timeZone: "UTC",
          },
          endTime: {
            dateTime: window.end.toISOString(),
            timeZone: "UTC",
          },
          availabilityViewInterval: 30,
        }),
      });
      if (!res.ok) throw new Error(`ms_freebusy_${res.status}`);
      const json = (await res.json()) as {
        value?: Array<{
          scheduleItems?: Array<{ start: { dateTime: string }; end: { dateTime: string } }>;
        }>;
      };
      const items = json.value?.[0]?.scheduleItems ?? [];
      return items.map((i) => ({
        start: new Date(i.start.dateTime + "Z"),
        end: new Date(i.end.dateTime + "Z"),
        isFree: false,
      }));
    },

    async createEvent(accessToken, input: CreateEventInput): Promise<CreatedEvent> {
      const res = await fetch("https://graph.microsoft.com/v1.0/me/events", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(buildMicrosoftEventRequest(input)),
      });
      if (!res.ok) throw new Error(`ms_create_${res.status}`);
      const json = (await res.json()) as {
        id?: string;
        onlineMeeting?: { joinUrl?: string };
      };
      return {
        externalEventId: String(json.id ?? ""),
        meetingUrl: json.onlineMeeting?.joinUrl ?? null,
      };
    },

    async cancelEvent(accessToken, externalEventId) {
      const res = await fetch(
        `https://graph.microsoft.com/v1.0/me/events/${encodeURIComponent(externalEventId)}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      if (!res.ok && res.status !== 404) throw new Error(`ms_cancel_${res.status}`);
    },
  };
}

export function microsoftCalendarAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.MS_CALENDAR_CLIENT_ID ?? "",
    redirect_uri: process.env.MS_CALENDAR_REDIRECT_URI ?? "",
    response_type: "code",
    scope: "offline_access Calendars.ReadWrite User.Read",
    state,
  });
  return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
}
