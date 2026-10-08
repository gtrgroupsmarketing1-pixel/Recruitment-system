"use server";
import { z } from "zod";

import { redirect } from "next/navigation";
import { withSessionScope } from "@/core/auth/action-scope";
import { requirePermission } from "@/core/auth/session";
import { ValidationError } from "@/lib/errors";
import { ComplianceTemplateService } from "./compliance.template.service";

const TemplateSchema = z.object({
  name: z.string().min(1),
  originCountry: z.string().min(2),
  destinationCountry: z.string().min(2),
});

export async function createTemplateAction(formData: FormData): Promise<void> {
  await withSessionScope(async (scope) => {
    requirePermission("compliance:template_manage");
    const parsed = TemplateSchema.safeParse({
      name: formData.get("name"),
      originCountry: String(formData.get("originCountry") ?? "").toUpperCase(),
      destinationCountry: String(formData.get("destinationCountry") ?? "").toUpperCase(),
    });
    if (!parsed.success) throw new ValidationError("Invalid template input");
    const name = parsed.data.name;
    const originCountry = parsed.data.originCountry;
    const destinationCountry = parsed.data.destinationCountry;
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
