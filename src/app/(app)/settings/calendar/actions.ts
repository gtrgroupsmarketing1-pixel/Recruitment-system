"use server";

import { redirect } from "next/navigation";
import { withSessionScope } from "@/core/auth/action-scope";
import { requirePermission } from "@/core/auth/session";
import { CalendarConnectionService } from "@/modules/calendar/calendar.connection.service";
import type { CalendarProvider } from "@prisma/client";

export async function disconnectCalendarAction(formData: FormData) {
  await withSessionScope(async (scope) => {
    requirePermission("calendar:connect_own");
    const provider = String(formData.get("provider") ?? "") as CalendarProvider;
    if (provider !== "GOOGLE" && provider !== "MICROSOFT") {
      redirect("/settings/calendar");
    }
    await CalendarConnectionService.disconnect(
      scope.tenantId,
      scope.userId,
      provider
    );
    redirect("/settings/calendar");
  });
}
