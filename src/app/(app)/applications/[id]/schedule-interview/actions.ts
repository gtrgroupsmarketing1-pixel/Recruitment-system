"use server";

import { revalidatePath } from "next/cache";
import { withSessionScope } from "@/core/auth/action-scope";
import { requirePermission } from "@/core/auth/session";
import { CalendarEventService } from "@/modules/calendar/calendar.event.service";

export async function scheduleInterviewAction(formData: FormData) {
  try {
    return await withSessionScope(async (scope) => {
      requirePermission("calendar:schedule_interview");
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
      const event = await CalendarEventService.scheduleInterview(
        scope.tenantId,
        scope.userId,
        {
          applicationId,
          startsAt,
          endsAt,
          timezone,
          attendees: [{ name: attendeeName, email: attendeeEmail }],
        }
      );
      revalidatePath(`/applications/${applicationId}`);
      return { ok: true as const, eventId: event.id };
    });
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
