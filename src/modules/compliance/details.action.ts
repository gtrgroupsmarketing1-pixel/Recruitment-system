"use server";

import { revalidatePath } from "next/cache";
import { withSessionScope } from "@/core/auth/action-scope";
import { requirePermission } from "@/core/auth/session";
import { ValidationError } from "@/lib/errors";
import { ComplianceDetailsService } from "./compliance.details.service";

export async function saveDetailsAction(formData: FormData): Promise<void> {
  await withSessionScope(async (scope) => {
    requirePermission("compliance:complete_step");
    const tenantId = scope.tenantId;
    const caseId = String(formData.get("caseId") ?? "");
    const checklistId = String(formData.get("checklistId") ?? "");
    const connectorId = String(formData.get("connectorId") ?? "");
    if (!caseId || !checklistId) throw new ValidationError("Missing case or step");

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
