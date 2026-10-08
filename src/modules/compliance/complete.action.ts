"use server";

import { revalidatePath } from "next/cache";
import { withSessionScope } from "@/core/auth/action-scope";
import { requirePermission } from "@/core/auth/session";
import { ValidationError } from "@/lib/errors";
import { ComplianceCaseService } from "./compliance.case.service";

export async function completeStepAction(formData: FormData): Promise<void> {
  await withSessionScope(async (scope) => {
    requirePermission("compliance:complete_step");
    const caseId = String(formData.get("caseId") ?? "");
    const checklistId = String(formData.get("checklistId") ?? "");
    if (!caseId || !checklistId) throw new ValidationError("Missing case or step");
    await ComplianceCaseService.completeStep(
      scope.tenantId,
      scope.userId,
      caseId,
      checklistId,
      []
    );
    revalidatePath(`/compliance/cases/${caseId}`);
  });
}
