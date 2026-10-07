"use server";

import { redirect } from "next/navigation";
import { requireSession } from "@/core/auth/session";
import { withTenant } from "@/core/db/client";
import { NotificationService } from "@/modules/notification/notification.service";

export async function retryNotificationAction(formData: FormData) {
  const session = await requireSession();
  const tenantId = session.user.tenantId || session.tenantId;
  if (!tenantId) {
    redirect("/login");
  }
  const id = String(formData.get("id") ?? "");
  if (!id) {
    redirect("/admin/notifications");
  }

  const created = await withTenant(tenantId, () =>
    NotificationService.retry(tenantId, id)
  );

  redirect(`/admin/notifications/${created.id}`);
}
