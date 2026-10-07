import { z } from "zod";
import { protectedProcedure, router } from "@/trpc/init";
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
    .query(({ ctx, input }) =>
      TaskService.listForUser(ctx.tenantId, ctx.userId, input)
    ),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }).strict())
    .query(({ ctx, input }) => TaskService.getById(ctx.tenantId, input.id)),

  update: protectedProcedure
    .input(UpdateTaskInput.extend({ id: z.string() }))
    .mutation(({ ctx, input }) => {
      const { id, ...patch } = input;
      return TaskService.update(ctx.tenantId, ctx.userId, id, patch);
    }),

  countsForUser: protectedProcedure.query(({ ctx }) =>
    TaskService.countsForUser(ctx.tenantId, ctx.userId)
  ),

  overdue: protectedProcedure.query(({ ctx }) =>
    TaskService.overdueForTenant(ctx.tenantId)
  ),
});
