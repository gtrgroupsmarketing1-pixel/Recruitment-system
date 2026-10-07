"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/core/auth/session";
import { withTenant } from "@/core/db/client";
import { ValidationError } from "@/lib/errors";
import { ComplianceDetailsService } from "./compliance.details.service";

export async function saveDetailsAction(formData: FormData): Promise<void> {
  const session = await requireSession();
  const tenantId = session.user.tenantId || session.tenantId;
  if (!tenantId || !session.user.id) throw new ValidationError("Missing session tenant");
  const caseId = String(formData.get("caseId") ?? "");
  const checklistId = String(formData.get("checklistId") ?? "");
  const connectorId = String(formData.get("connectorId") ?? "");
  await withTenant(tenantId, async () => {
    if (connectorId === "wafid") {
      await ComplianceDetailsService.saveMedicalDetails(tenantId, session.user.id, checklistId, {
        centerName: String(formData.get("centerName") ?? "") || null,
        result: String(formData.get("result") ?? "") || null,
      });
    } else if (connectorId === "mohre") {
      await ComplianceDetailsService.saveVisaDetails(tenantId, session.user.id, checklistId, {
        visaNumber: String(formData.get("visaNumber") ?? "") || null,
      });
    } else if (connectorId === "dmw") {
      await ComplianceDetailsService.saveLaborExitDetails(tenantId, session.user.id, checklistId, {
        clearanceType: String(formData.get("clearanceType") ?? "") || null,
      });
    } else if (connectorId === "travel") {
      await ComplianceDetailsService.saveTravelDetails(tenantId, session.user.id, checklistId, {
        flightNumber: String(formData.get("flightNumber") ?? "") || null,
      });
    } else if (connectorId === "deployment") {
      await ComplianceDetailsService.saveDeploymentDetails(tenantId, session.user.id, checklistId, {
        site: String(formData.get("site") ?? "") || null,
      });
    } else if (connectorId === "attestation") {
      await ComplianceDetailsService.saveAttestationDetails(tenantId, session.user.id, checklistId);
    }
  });
  revalidatePath(`/compliance/cases/${caseId}`);
}
