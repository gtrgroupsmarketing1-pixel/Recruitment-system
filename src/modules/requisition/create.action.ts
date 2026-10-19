"use server";

import { redirect } from "next/navigation";
import { withSessionScope } from "@/core/auth/action-scope";
import { requirePermission } from "@/core/auth/session";
import { logger } from "@/lib/logger";
import { CreateRequisitionInput } from "./requisition.schema";
import { RequisitionService } from "./requisition.service";

export type CreateFormState = { errors?: Record<string, string[]> };

export async function createRequisitionAction(
  _prev: CreateFormState,
  formData: FormData
): Promise<CreateFormState> {
  return withSessionScope(async (scope) => {
    requirePermission("requisition:create");
    const raw = Object.fromEntries(formData.entries());
    const payload: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(raw)) {
      if (typeof value !== "string") continue;
      if (value.trim() === "") continue;
      payload[key] = key === "vacancyTarget" ? Number(value) : value;
    }
    const parsed = CreateRequisitionInput.safeParse(payload);
    if (!parsed.success) {
      return {
        errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }
    try {
      await RequisitionService.create(scope.tenantId, scope.userId, parsed.data);
    } catch (error) {
      console.error("REQUISITION_CREATE_ERROR:", error);
      logger.error(
        { err: error instanceof Error ? error.message : String(error) },
        "requisition create failed"
      );
      const message =
        error instanceof Error ? error.message : "Failed to create requisition";
      return { errors: { form: [message] } };
    }
    redirect("/requisitions");
  });
}
