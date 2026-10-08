"use server";

import { redirect } from "next/navigation";
import { withSessionScope } from "@/core/auth/action-scope";
import { requirePermission } from "@/core/auth/session";
import { ValidationError } from "@/lib/errors";
import { ComplianceTemplateService } from "./compliance.template.service";

export async function createTemplateAction(formData: FormData): Promise<void> {
  await withSessionScope(async (scope) => {
    requirePermission("compliance:template_manage");
    const name = String(formData.get("name") ?? "");
    const originCountry = String(formData.get("originCountry") ?? "").toUpperCase();
    const destinationCountry = String(
      formData.get("destinationCountry") ?? ""
    ).toUpperCase();
    const roleCategory = String(formData.get("roleCategory") ?? "");
    if (!name) throw new ValidationError("Name required");
    const created = await ComplianceTemplateService.createTemplate(
      scope.tenantId,
      scope.userId,
      {
        name,
        originCountry,
        destinationCountry,
        roleCategory,
        steps: [
          {
            stepOrder: 1,
            name: "First step",
            responsibleParty: "RECRUITER",
            requiredDocuments: [],
            slaDays: 1,
            dependsOnStepOrder: null,
            connectorId: null,
          },
        ],
      }
    );
    redirect(`/compliance/templates/${created.id}`);
  });
}
