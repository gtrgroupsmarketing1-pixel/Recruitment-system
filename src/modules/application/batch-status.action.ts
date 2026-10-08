"use server";

import { revalidatePath } from "next/cache";
import { withSessionScope } from "@/core/auth/action-scope";
import { requirePermission } from "@/core/auth/session";
import { ValidationError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { ApplicationStatusSchema } from "./application.schema";
import { ApplicationService } from "./application.service";

/**
 * Batch status change. Each application gets its own changeStatus call.
 * Partial success is intentional — one illegal transition does not block the rest.
 */
export async function batchStatusAction(formData: FormData): Promise<void> {
  await withSessionScope(async (scope) => {
    requirePermission("application:change_status");
    const ids = formData.getAll("applicationId").map(String).filter(Boolean);
    const requisitionId = String(formData.get("requisitionId") ?? "");
    const parsed = ApplicationStatusSchema.safeParse(
      String(formData.get("toStatus") ?? "")
    );
    if (!parsed.success) {
      throw new ValidationError("Invalid status");
    }
    if (ids.length === 0) return;

    for (const id of ids) {
      try {
        await ApplicationService.changeStatus(
          scope.tenantId,
          scope.userId,
          id,
          parsed.data
        );
      } catch (err) {
        logger.warn(
          {
            applicationId: id,
            err: err instanceof Error ? err.message : "batch_failed",
          },
          "batch status change failed"
        );
      }
    }

    if (requisitionId) {
      revalidatePath(`/requisitions/${requisitionId}`);
    }
    revalidatePath("/candidates/bulk");
  });
}
