"use server";

import { redirect } from "next/navigation";
import { withSessionScope } from "@/core/auth/action-scope";
import { requirePermission } from "@/core/auth/session";
import { NotificationService } from "@/modules/notification/notification.service";

export async function retryNotificationAction(formData: FormData) {
  await withSessionScope(async (scope) => {
    requirePermission("admin:notifications");
    const id = String(formData.get("id") ?? "");
    if (!id) {
      redirect("/admin/notifications");
    }
    const created = await NotificationService.retry(scope.tenantId, id);
    redirect(`/admin/notifications/${created.id}`);
  });
}
