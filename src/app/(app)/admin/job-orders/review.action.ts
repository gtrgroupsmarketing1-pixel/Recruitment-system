"use server";
import { revalidatePath } from "next/cache";
import { withSessionScope } from "@/core/auth/action-scope";
import { requirePermission } from "@/core/auth/session";
import { JobOrderService } from "@/modules/client/joborder.service";

export async function reviewJobOrderAction(formData: FormData) {
  await withSessionScope(async (scope) => {
    requirePermission("joborder:review");
    const action = String(formData.get("action") ?? "");
    if (action !== "ACCEPT" && action !== "REJECT") return;
    await JobOrderService.review(
      scope.tenantId,
      scope.userId,
      String(formData.get("id") ?? ""),
      action,
      String(formData.get("notes") ?? "") || null
    );
    revalidatePath("/admin/job-orders");
  });
}
