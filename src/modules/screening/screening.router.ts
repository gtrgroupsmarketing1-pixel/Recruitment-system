import { z } from "zod";
import { protectedProcedure, router } from "@/trpc/init";
import { ScreeningService } from "./screening.service";

export const screeningRouter = router({
  getForApplication: protectedProcedure
    .input(z.object({ applicationId: z.string() }).strict())
    .query(({ ctx, input }) => {
      return ScreeningService.getForApplication(
        ctx.tenantId,
        input.applicationId
      );
    }),
  completeStep: protectedProcedure
    .input(
      z
        .object({
          screeningId: z.string(),
          stepOrder: z.number().int(),
          status: z.enum(["PENDING", "PASSED", "FAILED"]),
          score: z.number().int().nullable().optional(),
          notes: z.string().nullable().optional(),
        })
        .strict()
    )
    .mutation(({ ctx, input }) => {
      return ScreeningService.completeStep(
        ctx.tenantId,
        ctx.userId!,
        input.screeningId,
        input.stepOrder,
        input.status,
        input.score ?? undefined,
        input.notes ?? undefined
      );
    }),
  finalizeScreening: protectedProcedure
    .input(z.object({ screeningId: z.string() }).strict())
    .mutation(({ ctx, input }) => {
      return ScreeningService.finalizeScreening(
        ctx.tenantId,
        ctx.userId!,
        input.screeningId
      );
    }),
});
