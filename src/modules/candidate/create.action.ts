"use server";

import { redirect } from "next/navigation";
import { withSessionScope } from "@/core/auth/action-scope";
import { CandidateService } from "./candidate.service";
import { CreateCandidateInput } from "./candidate.schema";

export async function createCandidateAction(formData: FormData) {
  let errorMsg: string | null = null;

  try {
    await withSessionScope(async (scope) => {
      const raw = Object.fromEntries(formData.entries());
      
      // Pass a new object to Zod instead of mutating raw
      const parsed = CreateCandidateInput.safeParse({
        ...raw,
        smsOptIn: raw.smsOptIn === "on",
      });

      if (!parsed.success) {
        throw new Error(Object.values(parsed.error.flatten().fieldErrors).flat()[0] || "Validation failed");
      }
      
      await CandidateService.create(scope.tenantId, scope.userId, parsed.data);
    });
  } catch (error) {
    console.error("CANDIDATE_CREATE_ERROR:", error);
    errorMsg = error instanceof Error ? error.message : "Failed to create candidate";
  }

  if (errorMsg) {
    redirect(`/candidates/new?error=${encodeURIComponent(errorMsg)}`);
  }

  redirect("/candidates");
}