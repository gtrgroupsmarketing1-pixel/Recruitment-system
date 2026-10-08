import type {
  ExternalCalendarClient,
  TimeWindow,
  FreeBusySlot,
  CreateEventInput,
  CreatedEvent,
} from "./calendar.client";
import { buildGoogleEventRequest, googleCreateEventUrl } from "./google.payload";

export function createGoogleCalendarClient(): ExternalCalendarClient {
  return {
    async getFreeBusy(accessToken, window): Promise<FreeBusySlot[]> {
      const res = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          timeMin: window.start.toISOString(),
          timeMax: window.end.toISOString(),
          items: [{ id: "primary" }],
        }),
      });
      if (!res.ok) throw new Error(`google_freebusy_${res.status}`);
      const json = (await res.json()) as {
        calendars?: { primary?: { busy?: Array<{ start: string; end: string }> } };
      };
      const busy = json.calendars?.primary?.busy ?? [];
      return busy.map((b) => ({
        start: new Date(b.start),
        end: new Date(b.end),
        isFree: false,
      }));
    },

    async createEvent(accessToken, input: CreateEventInput): Promise<CreatedEvent> {
      const res = await fetch(googleCreateEventUrl(), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(buildGoogleEventRequest(input)),
      });
      if (!res.ok) throw new Error(`google_create_${res.status}`);
      const json = (await res.json()) as {
        id?: string;
        hangoutLink?: string;
        conferenceData?: { entryPoints?: Array<{ uri?: string }> };
      };
      const meetingUrl =
        json.hangoutLink ??
        json.conferenceData?.entryPoints?.[0]?.uri ??
        null;
      return { externalEventId: String(json.id ?? ""), meetingUrl };
    },

    async cancelEvent(accessToken, externalEventId) {
      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(externalEventId)}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      if (!res.ok && res.status !== 404 && res.status !== 410) {
        throw new Error(`google_cancel_${res.status}`);
      }
    },
  };
}

export function googleCalendarAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CALENDAR_CLIENT_ID ?? "",
    redirect_uri: process.env.GOOGLE_CALENDAR_REDIRECT_URI ?? "",
    response_type: "code",
    scope: [
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/calendar.readonly",
      "https://www.googleapis.com/auth/userinfo.email",
    ].join(" "),
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}
