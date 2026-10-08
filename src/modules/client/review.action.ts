"use server";
import { revalidatePath } from "next/cache";
import { withSessionScope } from "@/core/auth/action-scope";
import { requirePermission } from "@/core/auth/session";
import { ClientReviewService } from "./client.review.service";

export async function submitDecisionAction(formData: FormData) {
  await withSessionScope(async (scope) => {
    requirePermission("client:comment_candidate");
    const decision = String(formData.get("decision") ?? "SHORTLISTED");
    if (decision !== "APPROVED" && decision !== "REJECTED" && decision !== "SHORTLISTED") return;
    await ClientReviewService.submitDecision(
      scope.tenantId,
      scope.userId,
      String(formData.get("applicationId") ?? ""),
      decision,
      String(formData.get("comment") ?? "") || null
    );
    revalidatePath("/client/requisitions");
  });
}
