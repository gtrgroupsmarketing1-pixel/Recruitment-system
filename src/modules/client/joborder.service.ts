import { db } from "@/core/db/client";
import { eventBus } from "@/core/events/event-bus";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";
import { getUserScope } from "@/core/auth/scope";
import { RequisitionService } from "@/modules/requisition/requisition.service";

export const JobOrderService = {
  async submit(
    tenantId: string,
    userId: string,
    input: {
      roleTitle: string;
      roleCategory: string;
      country: string;
      vacancyCount: number;
      targetStartDate?: Date | null;
      description?: string | null;
    }
  ) {
    const scope = getUserScope();
    if (scope.role !== "CLIENT_USER" || !scope.clientCompanyId) {
      throw new ForbiddenError("Client company scope required");
    }
    const row = await db.jobOrder.create({
      data: {
        tenantId,
        clientCompanyId: scope.clientCompanyId,
        submittedBy: userId,
        roleTitle: input.roleTitle,
        roleCategory: input.roleCategory,
        country: input.country,
        vacancyCount: input.vacancyCount,
        targetStartDate: input.targetStartDate ?? null,
        description: input.description ?? null,
        status: "PENDING",
      },
    });
    await eventBus.publish({
      type: "joborder.submitted",
      tenantId,
      payload: {
        jobOrderId: row.id,
        clientCompanyId: scope.clientCompanyId,
        roleTitle: input.roleTitle,
        submittedBy: userId,
      },
    });
    return row;
  },

  async listForClient(tenantId: string) {
    const scope = getUserScope();
    if (!scope.clientCompanyId) return [];
    return db.jobOrder.findMany({
      where: { tenantId, clientCompanyId: scope.clientCompanyId, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
  },

  async listForStaff(tenantId: string) {
    return db.jobOrder.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        clientCompany: { select: { id: true, name: true, code: true } },
      },
    });
  },

  async review(
    tenantId: string,
    userId: string,
    id: string,
    action: "ACCEPT" | "REJECT",
    notes: string | null
  ) {
    const order = await db.jobOrder.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!order) throw new NotFoundError("JobOrder", id);
    if (order.status !== "PENDING") throw new ValidationError("Job order is not pending");
    if (action === "REJECT") {
      return db.jobOrder.update({
        where: { id },
        data: {
          status: "REJECTED",
          reviewedBy: userId,
          reviewedAt: new Date(),
          reviewNotes: notes,
        },
      });
    }
    const category = order.roleCategory.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4) || "GEN";
    const country = ["AE", "SA", "QA", "KW", "BH", "OM"].includes(order.country)
      ? (order.country as "AE")
      : "AE";
    const req = await RequisitionService.create(tenantId, userId, {
      clientCompanyId: order.clientCompanyId,
      roleCategory: category.length >= 2 ? category : "GEN",
      country,
      vacancyTarget: order.vacancyCount,
      targetOnboardingDate: order.targetStartDate ?? undefined,
      notes: order.description ?? undefined,
    });
    return db.jobOrder.update({
      where: { id },
      data: {
        status: "CONVERTED",
        reviewedBy: userId,
        reviewedAt: new Date(),
        reviewNotes: notes,
        requisitionId: req.id,
      },
    });
  },
};
