import { z } from "zod";
import { protectedProcedure, router } from "@/trpc/init";
import { ApplicationService } from "./application.service";
import { ApplicationStatus } from "@prisma/client";

const statusSchema = z.nativeEnum(ApplicationStatus);

/**
 * Application tRPC router. Validate + delegate only.
 */
export const applicationRouter = router({
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
        toStatus: statusSchema,
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
