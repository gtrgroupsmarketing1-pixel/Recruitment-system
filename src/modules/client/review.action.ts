"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { withSessionScope } from "@/core/auth/action-scope";
import { requirePermission } from "@/core/auth/session";
import { ClientReviewService } from "./client.review.service";

const DecisionSchema = z.object({
  applicationId: z.string().min(1),
  decision: z.enum(["APPROVED", "REJECTED", "SHORTLISTED"]),
  comment: z.string().optional().nullable(),
});

export async function submitDecisionAction(formData: FormData) {
  const parsed = DecisionSchema.safeParse({
    applicationId: formData.get("applicationId"),
    decision: formData.get("decision") ?? "SHORTLISTED",
    comment: formData.get("comment") || null,
  });
  if (!parsed.success) return;
  await withSessionScope(async (scope) => {
    requirePermission("client:comment_candidate");
    await ClientReviewService.submitDecision(
      scope.tenantId,
      scope.userId,
      parsed.data.applicationId,
      parsed.data.decision,
      parsed.data.comment || null
    );
    revalidatePath("/client/requisitions");
  });
}
