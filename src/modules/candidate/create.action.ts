"use server";

import { redirect } from "next/navigation";
import { withSessionScope } from "@/core/auth/action-scope";
import { requirePermission } from "@/core/auth/session";
import { ApplicationService } from "@/modules/application/application.service";
import { CandidateService } from "./candidate.service";
import { CreateCandidateInput } from "./candidate.schema";

export type CandidateFormState = { errors?: Record<string, string[]> };

function isRedirectError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    String((error as { digest?: string }).digest).startsWith("NEXT_REDIRECT")
  );
}

export async function createCandidateAction(
  _prev: CandidateFormState,
  formData: FormData
): Promise<CandidateFormState> {
  try {
    return await withSessionScope(async (scope) => {
      requirePermission("candidate:create");
      const raw = Object.fromEntries(formData.entries());
      const payload: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(raw)) {
        if (typeof value === "string" && value.trim() !== "") {
          payload[key] = value.trim();
        }
      }
      payload.smsOptIn = formData.get("smsOptIn") === "on";

      // Empty optional email must not be validated as invalid email
      if (payload.email === "") delete payload.email;

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
        try {
          await ApplicationService.create(scope.tenantId, scope.userId, {
            candidateId: created.id,
            requisitionId,
          });
        } catch (linkError) {
          // Candidate exists; surface link failure without losing the record
          const msg =
            linkError instanceof Error
              ? linkError.message
              : "Candidate created but could not link to requisition";
          redirect(
            `/candidates/${created.id}?error=${encodeURIComponent(msg)}`
          );
        }
      }
      redirect(`/candidates/${created.id}`);
    });
  } catch (error) {
    if (isRedirectError(error)) throw error;
    const msg = error instanceof Error ? error.message : "Could not create candidate";
    return { errors: { form: [msg] } };
  }
}
