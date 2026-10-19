"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { withSessionScope } from "@/core/auth/action-scope";
import { ValidationError } from "@/lib/errors";
import { ScreeningService } from "./screening.service";

const CompleteStepSchema = z.object({
  screeningId: z.string().min(1),
  requisitionId: z.string().min(1),
  stepOrder: z.coerce.number().int(),
  status: z.enum(["PENDING", "PASSED", "FAILED"]),
  score: z.coerce.number().int().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function completeStepAction(formData: FormData): Promise<void> {
  await withSessionScope(async (scope) => {
    const parsed = CompleteStepSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) throw new ValidationError("Invalid step data");
    const { screeningId, requisitionId, stepOrder, status, score, notes } =
      parsed.data;
    await ScreeningService.completeStep(
      scope.tenantId,
      scope.userId,
      screeningId,
      stepOrder,
      status,
      score ?? undefined,
      notes ?? undefined
    );
    revalidatePath(`/requisitions/${requisitionId}`);
  });
}
