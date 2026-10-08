"use server";

import { redirect } from "next/navigation";
import { requireSession } from "@/core/auth/session";
import { withTenant } from "@/core/db/client";
import { CalendarConnectionService } from "@/modules/calendar/calendar.connection.service";
import type { CalendarProvider } from "@prisma/client";

export async function disconnectCalendarAction(formData: FormData) {
  const session = await requireSession();
  const tenantId = session.user.tenantId || session.tenantId;
  if (!tenantId) redirect("/login");
  const provider = String(formData.get("provider") ?? "") as CalendarProvider;
  if (provider !== "GOOGLE" && provider !== "MICROSOFT") {
    redirect("/settings/calendar");
  }
  await withTenant(tenantId, () =>
    CalendarConnectionService.disconnect(tenantId, session.user.id, provider)
  );
  redirect("/settings/calendar");
}
