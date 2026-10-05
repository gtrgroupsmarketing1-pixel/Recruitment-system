import { z } from "zod";
import { protectedProcedure, router } from "@/trpc/init";
import { RequisitionService } from "./requisition.service";
import {
  AssignRecruiterInput,
  CreateRequisitionInput,
  ListRequisitionInput,
  RequisitionIdInput,
  UpdateRequisitionInput,
} from "./requisition.schema";

export const requisitionRouter = router({
  create: protectedProcedure
    .input(CreateRequisitionInput)
    .mutation(({ ctx, input }) =>
      RequisitionService.create(ctx.tenantId, ctx.userId, input)
    ),

  list: protectedProcedure
    .input(ListRequisitionInput)
    .query(({ ctx, input }) => RequisitionService.list(ctx.tenantId, input)),

  getById: protectedProcedure
    .input(RequisitionIdInput)
    .query(({ ctx, input }) =>
      RequisitionService.getById(ctx.tenantId, input.id)
    ),

  update: protectedProcedure
    .input(UpdateRequisitionInput)
    .mutation(({ ctx, input }) => {
      const { id, ...patch } = input;
      return RequisitionService.update(ctx.tenantId, ctx.userId, id, patch);
    }),

  assignRecruiter: protectedProcedure
    .input(AssignRecruiterInput)
    .mutation(({ ctx, input }) =>
      RequisitionService.assignRecruiter(
        ctx.tenantId,
        ctx.userId,
        input.id,
        input.recruiterId
      )
    ),

  computeFulfillment: protectedProcedure
    .input(RequisitionIdInput)
    .query(({ ctx, input }) =>
      RequisitionService.computeFulfillment(ctx.tenantId, input.id)
    ),
});

void z;
