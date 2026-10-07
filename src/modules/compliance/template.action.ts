"use server";

import { redirect } from "next/navigation";
import { requireSession } from "@/core/auth/session";
import { withTenant } from "@/core/db/client";
import { ValidationError } from "@/lib/errors";
import { ComplianceTemplateService } from "./compliance.template.service";

export async function createTemplateAction(formData: FormData): Promise<void> {
  const session = await requireSession();
  const tenantId = session.user.tenantId || session.tenantId;
  if (!tenantId || !session.user.id) throw new ValidationError("Missing session tenant");
  const name = String(formData.get("name") ?? "");
  const originCountry = String(formData.get("originCountry") ?? "").toUpperCase();
  const destinationCountry = String(formData.get("destinationCountry") ?? "").toUpperCase();
  const roleCategory = String(formData.get("roleCategory") ?? "");
  const created = await withTenant(tenantId, () =>
    ComplianceTemplateService.createTemplate(tenantId, session.user.id, {
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
    })
  );
  redirect(`/compliance/templates/${created.id}`);
}
