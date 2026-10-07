"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/core/auth/session";
import { withTenant } from "@/core/db/client";
import { ValidationError } from "@/lib/errors";
import { ComplianceCaseService } from "./compliance.case.service";

export async function completeStepAction(formData: FormData): Promise<void> {
  const session = await requireSession();
  const tenantId = session.user.tenantId || session.tenantId;
  if (!tenantId || !session.user.id) {
    throw new ValidationError("Missing session tenant");
  }
  const caseId = String(formData.get("caseId") ?? "");
  const checklistId = String(formData.get("checklistId") ?? "");
  if (!caseId || !checklistId) throw new ValidationError("Missing case or step");
  await withTenant(tenantId, () =>
    ComplianceCaseService.completeStep(tenantId, session.user.id, caseId, checklistId, [])
  );
  revalidatePath(`/compliance/cases/${caseId}`);
}
