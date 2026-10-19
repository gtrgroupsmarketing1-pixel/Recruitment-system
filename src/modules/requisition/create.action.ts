"use server";

import { redirect } from "next/navigation";
import { withSessionScope } from "@/core/auth/action-scope";
import { requirePermission } from "@/core/auth/session";
import { logger } from "@/lib/logger";
import { CreateRequisitionInput } from "./requisition.schema";
import { RequisitionService } from "./requisition.service";

export async function createRequisitionAction(formData: FormData) {
  let errorMsg: string | null = null;

  try {
    await withSessionScope(async (scope) => {
      requirePermission("requisition:create");
      const raw = Object.fromEntries(formData.entries());
      const payload: Record<string, unknown> = {};
      
      for (const [key, value] of Object.entries(raw)) {
        if (typeof value !== "string") continue;
        if (value.trim() === "") continue;
        // Convert numbers and dates appropriately
        if (key === "vacancyTarget") {
          payload[key] = Number(value);
        } else {
          payload[key] = value;
        }
      }
      
      const parsed = CreateRequisitionInput.safeParse(payload);
      if (!parsed.success) {
        const firstError = Object.values(parsed.error.flatten().fieldErrors).flat()[0] || "Validation failed";
        throw new Error(firstError);
      }
      
      await RequisitionService.create(scope.tenantId, scope.userId, parsed.data);
    });
  } catch (error) {
    console.error("REQUISITION_CREATE_ERROR:", error);
    logger.error(
      { err: error instanceof Error ? error.message : String(error) },
      "requisition create failed"
    );
    errorMsg = error instanceof Error ? error.message : "Failed to create requisition";
  }

  // If there was an error, redirect back to the form with the error message
  if (errorMsg) {
    redirect(`/requisitions/new?error=${encodeURIComponent(errorMsg)}`);
  }

  // Only redirect to the list if successful
  redirect("/requisitions");
}