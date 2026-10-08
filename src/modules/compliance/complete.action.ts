"use server";
import { z } from "zod";

import { revalidatePath } from "next/cache";
import { withSessionScope } from "@/core/auth/action-scope";
import { requirePermission } from "@/core/auth/session";
import { ValidationError } from "@/lib/errors";
import { ComplianceCaseService } from "./compliance.case.service";

const CompleteStepSchema = z.object({
  caseId: z.string().min(1),
  checklistId: z.string().min(1),
});

export async function completeStepAction(formData: FormData): Promise<void> {
  await withSessionScope(async (scope) => {
    requirePermission("compliance:complete_step");
    const parsed = CompleteStepSchema.safeParse({
      caseId: formData.get("caseId"),
      checklistId: formData.get("checklistId"),
    });
    if (!parsed.success) throw new ValidationError("Missing case or step");
    const { caseId, checklistId } = parsed.data;
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
