import { z } from "zod";
import { protectedProcedure, router } from "@/trpc/init";
import { requirePermission } from "@/core/auth/session";
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
    .mutation(({ ctx, input }) => {
      requirePermission("requisition:create");
      return RequisitionService.create(ctx.tenantId, ctx.userId, input);
    }),

  list: protectedProcedure
    .input(ListRequisitionInput)
    .query(({ ctx, input }) => {
      requirePermission("requisition:view");
      return RequisitionService.list(ctx.tenantId, input);
    }),

  getById: protectedProcedure
    .input(RequisitionIdInput)
    .query(({ ctx, input }) => {
      requirePermission("requisition:view");
      return RequisitionService.getById(ctx.tenantId, input.id);
    }),

  update: protectedProcedure
    .input(UpdateRequisitionInput)
    .mutation(({ ctx, input }) => {
      requirePermission("requisition:update");
      const { id, ...patch } = input;
      return RequisitionService.update(ctx.tenantId, ctx.userId, id, patch);
    }),

  assignRecruiter: protectedProcedure
    .input(AssignRecruiterInput)
    .mutation(({ ctx, input }) => {
      requirePermission("requisition:assign_recruiter");
      return RequisitionService.assignRecruiter(
        ctx.tenantId,
        ctx.userId,
        input.id,
        input.recruiterId
      );
    }),

  computeFulfillment: protectedProcedure
    .input(RequisitionIdInput)
    .query(({ ctx, input }) => {
      requirePermission("requisition:view");
      return RequisitionService.computeFulfillment(ctx.tenantId, input.id);
    }),
});

void z;
