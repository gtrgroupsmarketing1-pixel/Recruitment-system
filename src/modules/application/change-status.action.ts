"use server";

import { revalidatePath } from "next/cache";
import { withSessionScope } from "@/core/auth/action-scope";
import { requirePermission } from "@/core/auth/session";
import { ValidationError } from "@/lib/errors";
import { ApplicationStatusSchema } from "./application.schema";
import { ApplicationService } from "./application.service";
import { ApplicationRepo } from "./application.repo";
import { requireChangeStatusPermission } from "@/core/auth/status-permission";
import { NotFoundError } from "@/lib/errors";
import type { Status } from "./application.state-machine";

export async function changeStatusAction(formData: FormData): Promise<void> {
  await withSessionScope(async (scope) => {
    requirePermission("application:change_status");
    const applicationId = String(formData.get("applicationId") ?? "");
    const requisitionId = String(formData.get("requisitionId") ?? "");
    const parsed = ApplicationStatusSchema.safeParse(
      String(formData.get("toStatus") ?? "")
    );
    if (!parsed.success) {
      throw new ValidationError("Invalid status");
    }
    const app = await ApplicationRepo.findById(scope.tenantId, applicationId);
    if (!app) throw new NotFoundError("Application");
    requireChangeStatusPermission(scope, app.status as Status, parsed.data as Status);
    await ApplicationService.changeStatus(
      scope.tenantId,
      scope.userId,
      applicationId,
      parsed.data
    );
    if (requisitionId) {
      revalidatePath(`/requisitions/${requisitionId}`);
    }
  });
}
