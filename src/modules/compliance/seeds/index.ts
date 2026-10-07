import { ComplianceTemplateService } from "@/modules/compliance/compliance.template.service";
import { INDIA_UAE_BLUE_COLLAR } from "./india-uae-blue-collar";

/** Explicit seeder. Not called at boot. */
export async function seedTemplateForTenant(tenantId: string, userId: string) {
  return ComplianceTemplateService.createTemplate(
    tenantId,
    userId,
    INDIA_UAE_BLUE_COLLAR
  );
}

export { INDIA_UAE_BLUE_COLLAR };
