"use server";
import { redirect } from "next/navigation";
import { withSessionScope } from "@/core/auth/action-scope";
import { requirePermission } from "@/core/auth/session";
import { JobOrderService } from "./joborder.service";

export async function submitJobOrderAction(formData: FormData) {
  const created = await withSessionScope(async (scope) => {
    requirePermission("joborder:submit");
    return JobOrderService.submit(scope.tenantId, scope.userId, {
      roleTitle: String(formData.get("roleTitle") ?? ""),
      roleCategory: String(formData.get("roleCategory") ?? ""),
      country: String(formData.get("country") ?? "AE"),
      vacancyCount: Number(formData.get("vacancyCount") ?? 1),
      description: String(formData.get("description") ?? "") || null,
    });
  });
  redirect(`/client/job-orders/${created.id}`);
}
