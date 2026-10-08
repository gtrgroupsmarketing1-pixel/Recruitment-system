import { z } from "zod";
import { protectedProcedure, router } from "@/trpc/init";
import { requirePermission } from "@/core/auth/session";
import { TaskService } from "./task.service";
import { UpdateTaskInput } from "./task.schema";

export const taskRouter = router({
  listForUser: protectedProcedure
    .input(
      z
        .object({
          status: z
            .enum(["OPEN", "IN_PROGRESS", "COMPLETED", "OVERDUE", "CANCELLED"])
            .optional(),
          includeCompleted: z.boolean().optional(),
        })
        .strict()
    )
    .query(({ ctx, input }) => {
      requirePermission("task:view_own");
      return TaskService.listForUser(ctx.tenantId, ctx.userId, input);
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }).strict())
    .query(({ ctx, input }) => {
      requirePermission("task:view_own");
      return TaskService.getById(ctx.tenantId, input.id);
    }),

  update: protectedProcedure
    .input(UpdateTaskInput.extend({ id: z.string() }))
    .mutation(({ ctx, input }) => {
      requirePermission("task:update");
      const { id, ...patch } = input;
      return TaskService.update(ctx.tenantId, ctx.userId, id, patch);
    }),

  countsForUser: protectedProcedure.query(({ ctx }) => {
    requirePermission("task:view_own");
    return TaskService.countsForUser(ctx.tenantId, ctx.userId);
  }),

  overdue: protectedProcedure.query(({ ctx }) => {
    requirePermission("task:view_all");
    return TaskService.overdueForTenant(ctx.tenantId);
  }),
});
