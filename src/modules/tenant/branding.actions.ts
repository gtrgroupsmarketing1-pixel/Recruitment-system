"use server";

import { revalidatePath } from "next/cache";
import { withSessionScope } from "@/core/auth/action-scope";
import { requirePermission } from "@/core/auth/session";
import { BrandingService } from "@/modules/tenant/branding.service";

export async function saveBrandingAction(formData: FormData) {
  try {
    await withSessionScope(async (scope) => {
      requirePermission("tenant:manage_branding");
      await BrandingService.update(scope.tenantId, scope.role, {
        displayName: String(formData.get("displayName") ?? "").trim() || undefined,
        primaryColor: String(formData.get("primaryColor") ?? "").trim() || undefined,
        defaultLocale: String(formData.get("defaultLocale") ?? "en").trim(),
        logoUrl: String(formData.get("logoUrl") ?? "").trim() || null,
        customDomain: String(formData.get("customDomain") ?? "").trim() || null,
      });
    });
    revalidatePath("/admin/branding");
    return { success: true as const };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Save failed",
    };
  }
}
