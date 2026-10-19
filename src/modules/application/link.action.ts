"use server";

import { redirect } from "next/navigation";
import { withSessionScope } from "@/core/auth/action-scope";
import { ApplicationService } from "./application.service";

export async function linkCandidateAction(formData: FormData) {
  const candidateId = formData.get("candidateId") as string;
  const requisitionId = formData.get("requisitionId") as string;

  if (!candidateId || !requisitionId) {
    redirect(`/candidates/${candidateId}?error=Missing+IDs`);
  }

  let errorMsg: string | null = null;

  try {
    await withSessionScope(async (scope) => {
      await ApplicationService.create(scope.tenantId, scope.userId, {
        candidateId,
        requisitionId,
      });
    });
  } catch (error) {
    console.error("LINK_ACTION_ERROR:", error);
    errorMsg = error instanceof Error ? error.message : "Failed to link candidate";
  }

  if (errorMsg) {
    redirect(`/candidates/${candidateId}?error=${encodeURIComponent(errorMsg)}`);
  }

  redirect(`/candidates/${candidateId}`);
}