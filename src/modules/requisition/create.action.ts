"use server";

import { redirect } from "next/navigation";
import { withSessionScope } from "@/core/auth/action-scope";
import { requirePermission } from "@/core/auth/session";
import { CreateRequisitionInput } from "./requisition.schema";
import { RequisitionService } from "./requisition.service";

export type CreateFormState = { errors?: Record<string, string[]> };

function isRedirectError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    String((error as { digest?: string }).digest).startsWith("NEXT_REDIRECT")
  );
}

export async function createRequisitionAction(
  _prev: CreateFormState,
  formData: FormData
): Promise<CreateFormState> {
  try {
    return await withSessionScope(async (scope) => {
      requirePermission("requisition:create");
      const raw = Object.fromEntries(formData.entries());
      const payload: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(raw)) {
        if (typeof value !== "string") continue;
        if (value.trim() === "") continue;
        if (key === "vacancyTarget") {
          payload[key] = Number(value);
        } else if (key === "roleCategory") {
          payload[key] = value.trim().toUpperCase();
        } else {
          payload[key] = value;
        }
      }
      const parsed = CreateRequisitionInput.safeParse(payload);
      if (!parsed.success) {
        return {
          errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
        };
      }
      const created = await RequisitionService.create(
        scope.tenantId,
        scope.userId,
        parsed.data
      );
      redirect(`/requisitions/${created.id}`);
    });
  } catch (error) {
    if (isRedirectError(error)) throw error;
    const msg = error instanceof Error ? error.message : "Could not create requisition";
    return { errors: { form: [msg] } };
  }
}
