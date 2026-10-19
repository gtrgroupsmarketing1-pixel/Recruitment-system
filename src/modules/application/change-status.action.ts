"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { withSessionScope } from "@/core/auth/action-scope";
import { requirePermission } from "@/core/auth/session";
import { ValidationError, NotFoundError } from "@/lib/errors";
import { ApplicationStatusSchema } from "./application.schema";
import { ApplicationService } from "./application.service";
import { ApplicationRepo } from "./application.repo";
import { requireChangeStatusPermission } from "@/core/auth/status-permission";
import type { Status } from "./application.state-machine";

export async function changeStatusAction(formData: FormData): Promise<void> {
  const applicationId = String(formData.get("applicationId") ?? "");
  const candidateId = String(formData.get("candidateId") ?? "");
  const parsed = ApplicationStatusSchema.safeParse(
    String(formData.get("toStatus") ?? "")
  );

  let errorMsg: string | null = null;

  try {
    if (!parsed.success) {
      throw new ValidationError("Invalid status");
    }

    await withSessionScope(async (scope) => {
      requirePermission("application:change_status");
      const app = await ApplicationRepo.findById(scope.tenantId, applicationId);
      if (!app) throw new NotFoundError("Application");
      
      requireChangeStatusPermission(scope, app.status as Status, parsed.data as Status);
      
      await ApplicationService.changeStatus(
        scope.tenantId,
        scope.userId,
        applicationId,
        parsed.data
      );
    });
  } catch (error) {
    console.error("CHANGE_STATUS_ERROR:", error);
    errorMsg = error instanceof Error ? error.message : "Failed to change status";
  }

  if (errorMsg) {
    redirect(`/candidates/${candidateId}?error=${encodeURIComponent(errorMsg)}`);
  }

  // On success, reload the candidate page so the new status shows immediately
  revalidatePath(`/candidates/${candidateId}`);
  redirect(`/candidates/${candidateId}`);
}