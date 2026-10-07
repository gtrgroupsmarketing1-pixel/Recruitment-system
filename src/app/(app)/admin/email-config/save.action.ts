"use server";

import { redirect } from "next/navigation";
import { requireSession } from "@/core/auth/session";
import { withTenant } from "@/core/db/client";
import { NotificationService } from "@/modules/notification/notification.service";

export async function saveEmailConfigAction(formData: FormData) {
  const session = await requireSession();
  const tenantId = session.user.tenantId || session.tenantId;
  if (!tenantId) redirect("/login");

  const reply = String(formData.get("replyToEmail") ?? "").trim();
  const signature = String(formData.get("signatureHtml") ?? "").trim();

  await withTenant(tenantId, () =>
    NotificationService.saveEmailConfig(tenantId, {
      fromName: String(formData.get("fromName") ?? "").trim(),
      fromEmail: String(formData.get("fromEmail") ?? "").trim(),
      replyToEmail: reply.length > 0 ? reply : null,
      signatureHtml: signature.length > 0 ? signature : null,
    })
  );
  redirect("/admin/email-config?saved=1");
}
