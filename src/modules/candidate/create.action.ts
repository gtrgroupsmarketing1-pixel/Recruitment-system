"use server";

import { redirect } from "next/navigation";
import { withSessionScope } from "@/core/auth/action-scope";
import { requirePermission } from "@/core/auth/session";
import { ApplicationService } from "@/modules/application/application.service";
import { CandidateService } from "./candidate.service";
import { CreateCandidateInput } from "./candidate.schema";

export type CandidateFormState = { errors?: Record<string, string[]> };

export async function createCandidateAction(
  _prev: CandidateFormState,
  formData: FormData
): Promise<CandidateFormState> {
  return withSessionScope(async (scope) => {
    requirePermission("candidate:create");
    const raw = Object.fromEntries(formData.entries());
    const payload: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(raw)) {
      if (typeof value === "string" && value.trim() !== "") {
        payload[key] = value.trim();
      }
    }
    payload.smsOptIn = formData.get("smsOptIn") === "on";
    const parsed = CreateCandidateInput.safeParse(payload);
    if (!parsed.success) {
      const errors: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] ? String(issue.path[0]) : "form";
        errors[key] = [...(errors[key] ?? []), issue.message];
      }
      return { errors };
    }
    const created = await CandidateService.create(
      scope.tenantId,
      scope.userId,
      parsed.data
    );
    const requisitionId = parsed.data.requisitionId;
    if (requisitionId) {
      requirePermission("application:create");
      await ApplicationService.create(scope.tenantId, scope.userId, {
        candidateId: created.id,
        requisitionId,
      });
    }
    redirect(`/candidates/${created.id}`);
  });
}
