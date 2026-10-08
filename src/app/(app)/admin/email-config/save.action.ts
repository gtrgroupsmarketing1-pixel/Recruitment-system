"use server";

import { redirect } from "next/navigation";
import { withSessionScope } from "@/core/auth/action-scope";
import { requirePermission } from "@/core/auth/session";
import { NotificationService } from "@/modules/notification/notification.service";

export async function saveEmailConfigAction(formData: FormData) {
  await withSessionScope(async (scope) => {
    requirePermission("admin:email_config");
    const reply = String(formData.get("replyToEmail") ?? "").trim();
    const signature = String(formData.get("signatureHtml") ?? "").trim();

    await NotificationService.saveEmailConfig(scope.tenantId, {
      fromName: String(formData.get("fromName") ?? "").trim(),
      fromEmail: String(formData.get("fromEmail") ?? "").trim(),
      replyToEmail: reply.length > 0 ? reply : null,
      signatureHtml: signature.length > 0 ? signature : null,
    });
    redirect("/admin/email-config?saved=1");
  });
}
