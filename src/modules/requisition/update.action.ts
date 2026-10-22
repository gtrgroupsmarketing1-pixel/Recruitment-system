"use server";

import { redirect } from "next/navigation";
import { withSessionScope } from "@/core/auth/action-scope";
import { requirePermission } from "@/core/auth/session";
import { UpdateRequisitionInput } from "./requisition.schema";
import { RequisitionService } from "./requisition.service";

function isRedirectError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    String((error as { digest?: string }).digest).startsWith("NEXT_REDIRECT")
  );
}

export async function updateRequisitionAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/requisitions");

  try {
    await withSessionScope(async (scope) => {
      requirePermission("requisition:update");
      const vacancyRaw = formData.get("vacancyTarget");
      const payload: Record<string, unknown> = {
        id,
        jobTitle: formData.get("jobTitle") || null,
        roleCategory: formData.get("roleCategory") || undefined,
        country: formData.get("country") || undefined,
        location: formData.get("location") || null,
        notes: formData.get("notes") || null,
        status: formData.get("status") || undefined,
      };
      if (vacancyRaw != null && String(vacancyRaw).trim() !== "") {
        payload.vacancyTarget = Number(vacancyRaw);
      }
      const dateRaw = formData.get("targetOnboardingDate");
      if (dateRaw != null && String(dateRaw).trim() !== "") {
        payload.targetOnboardingDate = String(dateRaw);
      } else if (formData.has("targetOnboardingDate")) {
        payload.targetOnboardingDate = null;
      }
      const parsed = UpdateRequisitionInput.safeParse(payload);
      if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message ?? "Invalid data");
      }
      const { id: _id, ...patch } = parsed.data;
      await RequisitionService.update(scope.tenantId, scope.userId, id, patch);
    });
  } catch (error) {
    if (isRedirectError(error)) throw error;
    const msg = error instanceof Error ? error.message : "Update failed";
    redirect(`/requisitions/${id}?error=${encodeURIComponent(msg)}`);
  }
  redirect(`/requisitions/${id}`);
}

export async function deleteRequisitionAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/requisitions");
  try {
    await withSessionScope(async (scope) => {
      requirePermission("requisition:delete");
      await RequisitionService.softDelete(scope.tenantId, scope.userId, id);
    });
  } catch (error) {
    if (isRedirectError(error)) throw error;
    const msg = error instanceof Error ? error.message : "Delete failed";
    redirect(`/requisitions/${id}?error=${encodeURIComponent(msg)}`);
  }
  redirect("/requisitions");
}
