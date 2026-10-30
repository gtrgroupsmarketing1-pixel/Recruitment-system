"use server";

import { revalidatePath } from "next/cache";
import { withSessionScope } from "@/core/auth/action-scope";
import { requirePermission } from "@/core/auth/session";
import { JobOrderService } from "@/modules/client/joborder.service";

export async function convertJobOrderAction(jobOrderId: string) {
  try {
    const updated = await withSessionScope(async (scope) => {
      requirePermission("joborder:review");
      return JobOrderService.review(
        scope.tenantId,
        scope.userId,
        jobOrderId,
        "ACCEPT",
        null
      );
    });
    revalidatePath("/admin/job-orders");
    revalidatePath("/requisitions");
    return {
      success: true as const,
      requisitionId: updated.requisitionId ?? undefined,
    };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Convert failed",
    };
  }
}

export async function rejectJobOrderAction(jobOrderId: string) {
  try {
    await withSessionScope(async (scope) => {
      requirePermission("joborder:review");
      await JobOrderService.review(
        scope.tenantId,
        scope.userId,
        jobOrderId,
        "REJECT",
        null
      );
    });
    revalidatePath("/admin/job-orders");
    return { success: true as const };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Reject failed",
    };
  }
}
