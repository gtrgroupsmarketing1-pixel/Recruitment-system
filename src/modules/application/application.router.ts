import { z } from "zod";
import { protectedProcedure, router } from "@/trpc/init";
import { ApplicationService } from "./application.service";
import {
  ApplicationStatusSchema,
  CreateApplicationInput,
} from "./application.schema";

/**
 * Application tRPC router. Validate + delegate only.
 */
export const applicationRouter = router({
  create: protectedProcedure
    .input(CreateApplicationInput)
    .mutation(({ ctx, input }) =>
      ApplicationService.create(ctx.tenantId, ctx.userId, input)
    ),

  listByCandidate: protectedProcedure
    .input(z.object({ candidateId: z.string() }).strict())
    .query(({ ctx, input }) =>
      ApplicationService.listByCandidate(ctx.tenantId, input.candidateId)
    ),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ApplicationService.getById(ctx.tenantId, input.id);
    }),

  listByRequisition: protectedProcedure
    .input(z.object({ requisitionId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ApplicationService.listByRequisition(
        ctx.tenantId,
        input.requisitionId
      );
    }),

  changeStatus: protectedProcedure
    .input(
      z.object({
        applicationId: z.string(),
        toStatus: ApplicationStatusSchema,
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ApplicationService.changeStatus(
        ctx.tenantId,
        ctx.userId,
        input.applicationId,
        input.toStatus,
        input.reason
      );
    }),
});
