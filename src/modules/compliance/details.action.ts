"use server";
import { z } from "zod";

import { revalidatePath } from "next/cache";
import { withSessionScope } from "@/core/auth/action-scope";
import { requirePermission } from "@/core/auth/session";
import { ValidationError } from "@/lib/errors";
import { ComplianceDetailsService } from "./compliance.details.service";

const DetailsSchema = z.object({
  caseId: z.string().min(1),
  checklistId: z.string().min(1),
  connectorId: z.string().optional().default(""),
});

export async function saveDetailsAction(formData: FormData): Promise<void> {
  await withSessionScope(async (scope) => {
    requirePermission("compliance:complete_step");
    const tenantId = scope.tenantId;
    const parsed = DetailsSchema.safeParse({
      caseId: formData.get("caseId"),
      checklistId: formData.get("checklistId"),
      connectorId: formData.get("connectorId") ?? "",
    });
    if (!parsed.success) throw new ValidationError("Missing case or step");
    const { caseId, checklistId, connectorId } = parsed.data;

    if (connectorId === "wafid") {
      await ComplianceDetailsService.saveMedicalDetails(tenantId, scope.userId, checklistId, {
        centerName: String(formData.get("centerName") ?? "") || null,
        result: String(formData.get("result") ?? "") || null,
      });
    } else if (connectorId === "mohre") {
      await ComplianceDetailsService.saveVisaDetails(tenantId, scope.userId, checklistId, {
        visaNumber: String(formData.get("visaNumber") ?? "") || null,
      });
    } else if (connectorId === "dmw") {
      await ComplianceDetailsService.saveLaborExitDetails(tenantId, scope.userId, checklistId, {
        clearanceType: String(formData.get("clearanceType") ?? "") || null,
      });
    } else if (connectorId === "travel") {
      await ComplianceDetailsService.saveTravelDetails(tenantId, scope.userId, checklistId, {
        flightNumber: String(formData.get("flightNumber") ?? "") || null,
      });
    } else if (connectorId === "deployment") {
      await ComplianceDetailsService.saveDeploymentDetails(tenantId, scope.userId, checklistId, {
        site: String(formData.get("site") ?? "") || null,
      });
    } else if (connectorId === "attestation") {
      await ComplianceDetailsService.saveAttestationDetails(tenantId, scope.userId, checklistId);
    }
  
    revalidatePath(`/compliance/cases/${caseId}`);
  });
}
