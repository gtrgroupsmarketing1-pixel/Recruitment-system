export type TimeWindow = { start: Date; end: Date };
export type FreeBusySlot = { start: Date; end: Date; isFree: boolean };

export type CreateEventInput = {
  title: string;
  description?: string;
  startsAt: Date;
  endsAt: Date;
  timezone: string;
  attendees: Array<{ name: string; email: string }>;
  createMeetingLink: boolean;
};

export type CreatedEvent = {
  externalEventId: string;
  meetingUrl: string | null;
};

export interface ExternalCalendarClient {
  getFreeBusy(
    accessToken: string,
    window: TimeWindow,
    calendarIds?: string[]
  ): Promise<FreeBusySlot[]>;

  createEvent(accessToken: string, input: CreateEventInput): Promise<CreatedEvent>;

  cancelEvent(accessToken: string, externalEventId: string): Promise<void>;
}
