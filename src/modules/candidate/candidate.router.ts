import { protectedProcedure, router } from "@/trpc/init";
import { requirePermission } from "@/core/auth/session";
import { CandidateService } from "./candidate.service";
import {
  CreateCandidateInput,
  ListCandidateInput,
  UpdateCandidateInput,
} from "./candidate.schema";
import { z } from "zod";

export const candidateRouter = router({
  create: protectedProcedure
    .input(CreateCandidateInput)
    .mutation(({ ctx, input }) => {
      requirePermission("candidate:create");
      return CandidateService.create(ctx.tenantId, ctx.userId, input);
    }),

  list: protectedProcedure
    .input(ListCandidateInput)
    .query(({ ctx, input }) => {
      requirePermission("candidate:view");
      return CandidateService.list(ctx.tenantId, input);
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }).strict())
    .query(({ ctx, input }) => {
      requirePermission("candidate:view");
      return CandidateService.getById(ctx.tenantId, input.id);
    }),

  update: protectedProcedure
    .input(UpdateCandidateInput.extend({ id: z.string() }))
    .mutation(({ ctx, input }) => {
      requirePermission("candidate:update");
      const { id, ...patch } = input;
      return CandidateService.update(ctx.tenantId, ctx.userId, id, patch);
    }),
});
