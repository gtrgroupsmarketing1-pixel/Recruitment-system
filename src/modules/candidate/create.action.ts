"use server";

import type { Candidate } from "@prisma/client";
import { redirect } from "next/navigation";
import { withSessionScope } from "@/core/auth/action-scope";
import { requirePermission } from "@/core/auth/session";
import { logger } from "@/lib/logger";
import { ApplicationService } from "@/modules/application/application.service";
import { CandidateService } from "./candidate.service";
import { CreateCandidateInput } from "./candidate.schema";

export type CandidateFormState = { errors?: Record<string, string[]> };

export async function createCandidateAction(
  _prev: CandidateFormState,
  formData: FormData
): Promise<CandidateFormState> {
  return withSessionScope(async (scope) => {
    let created: Candidate | null = null;
    try {
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
      created = await CandidateService.create(
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
    } catch (error) {
      console.error("CANDIDATE_CREATE_ERROR:", error);
      logger.error(
        { err: error instanceof Error ? error.message : String(error) },
        "candidate create failed"
      );
      const message =
        error instanceof Error ? error.message : "Failed to create candidate";
      return { errors: { form: [message] } };
    }
    redirect(`/candidates/${created!.id}`);
  });
}
