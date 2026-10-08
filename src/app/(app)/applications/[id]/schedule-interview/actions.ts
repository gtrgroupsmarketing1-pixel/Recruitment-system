"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/core/auth/session";
import { withTenant } from "@/core/db/client";
import { CalendarEventService } from "@/modules/calendar/calendar.event.service";

export async function scheduleInterviewAction(formData: FormData) {
  const session = await requireSession();
  const tenantId = session.user.tenantId || session.tenantId;
  if (!tenantId) return { ok: false as const, error: "Missing tenant" };

  const applicationId = String(formData.get("applicationId") ?? "");
  const startsAt = new Date(String(formData.get("startsAt") ?? ""));
  const durationMin = Number(formData.get("durationMinutes") ?? 30);
  const timezone = String(formData.get("timezone") ?? "UTC");
  const attendeeName = String(formData.get("attendeeName") ?? "Candidate");
  const attendeeEmail = String(formData.get("attendeeEmail") ?? "");

  if (!applicationId || Number.isNaN(startsAt.getTime()) || !attendeeEmail) {
    return { ok: false as const, error: "Invalid input" };
  }

  const endsAt = new Date(startsAt.getTime() + durationMin * 60_000);

  try {
    const event = await withTenant(tenantId, () =>
      CalendarEventService.scheduleInterview(tenantId, session.user.id, {
        applicationId,
        startsAt,
        endsAt,
        timezone,
        attendees: [{ name: attendeeName, email: attendeeEmail }],
      })
    );
    revalidatePath(`/applications/${applicationId}`);
    return { ok: true as const, eventId: event.id };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
