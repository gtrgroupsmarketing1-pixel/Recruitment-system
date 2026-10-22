"use server";

import { redirect } from "next/navigation";
import { withSessionScope } from "@/core/auth/action-scope";
import { requirePermission } from "@/core/auth/session";
import { ApplicationService } from "@/modules/application/application.service";
import { CandidateService } from "./candidate.service";
import { UpdateCandidateInput } from "./candidate.schema";

export async function updateCandidateAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/candidates?error=missing");

  try {
    await withSessionScope(async (scope) => {
      requirePermission("candidate:update");
      const raw = Object.fromEntries(formData.entries());
      const payload: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(raw)) {
        if (key === "id" || key === "requisitionId") continue;
        if (typeof value === "string") {
          payload[key] = value.trim() === "" ? null : value.trim();
        }
      }
      if (formData.has("smsOptIn")) {
        payload.smsOptIn = formData.get("smsOptIn") === "on";
      }
      const parsed = UpdateCandidateInput.safeParse(payload);
      if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message ?? "Invalid data");
      }
      await CandidateService.update(scope.tenantId, scope.userId, id, parsed.data);

      const requisitionId = String(formData.get("requisitionId") ?? "");
      if (requisitionId) {
        requirePermission("application:create");
        await ApplicationService.create(scope.tenantId, scope.userId, {
          candidateId: id,
          requisitionId,
        });
      }
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Update failed";
    redirect(`/candidates/${id}?error=${encodeURIComponent(msg)}`);
  }
  redirect(`/candidates/${id}`);
}

export async function softDeleteCandidateAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/candidates");
  try {
    await withSessionScope(async (scope) => {
      requirePermission("candidate:delete");
      await CandidateService.softDelete(scope.tenantId, scope.userId, id);
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Delete failed";
    redirect(`/candidates/${id}?error=${encodeURIComponent(msg)}`);
  }
  redirect("/candidates");
}
