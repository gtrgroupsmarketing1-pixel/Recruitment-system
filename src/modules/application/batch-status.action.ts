"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/core/auth/session";
import { withTenant } from "@/core/db/client";
import { ValidationError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { ApplicationStatusSchema } from "./application.schema";
import { ApplicationService } from "./application.service";

/**
 * Batch status change. Each application gets its own withTenant + changeStatus.
 * Partial success is intentional — one illegal transition does not block the rest.
 */
export async function batchStatusAction(formData: FormData): Promise<void> {
  const session = await requireSession();
  const tenantId = session.user.tenantId || session.tenantId;
  if (!tenantId || !session.user.id) {
    throw new ValidationError("Missing session tenant");
  }
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
      await withTenant(tenantId, () =>
        ApplicationService.changeStatus(
          tenantId,
          session.user.id,
          id,
          parsed.data
        )
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
}
