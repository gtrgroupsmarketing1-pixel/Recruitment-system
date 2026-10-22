import type { JobRequisition } from "@prisma/client";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import { RequisitionRepo } from "./requisition.repo";
import {
  buildReqCode,
  currentYyyymm,
  reqCodePrefix,
} from "./requisition.id";
import { computeFulfillmentPct, computeSlaFlag } from "./requisition.metrics";
import type { CreateRequisitionInput, UpdateRequisitionInput } from "./requisition.schema";
import { tryGetScope } from "@/core/auth/scope";
import { requisitionScopeFilter, loadBranchUserIds } from "@/core/auth/scope-filter";

/**
 * Requisition business logic.
 * slaFlag and fulfillment are computed at read time — never stored.
 * No event publishing this session.
 */
export type RequisitionView = JobRequisition & {
  fulfillment: { mobilized: number; target: number; pct: number };
  slaFlag: "RED" | "AMBER" | "GREEN" | null;
  client: { id: string; name: string; code: string };
};

function isP2002(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === "P2002"
  );
}

async function toView(
  tenantId: string,
  row: JobRequisition
): Promise<RequisitionView> {
  const client = await RequisitionRepo.findClient(tenantId, row.clientCompanyId);
  const mobilized = await RequisitionRepo.countMobilized(tenantId, row.id);
  return {
    ...row,
    fulfillment: {
      mobilized,
      target: row.vacancyTarget,
      pct: computeFulfillmentPct(mobilized, row.vacancyTarget),
    },
    slaFlag: computeSlaFlag(row.targetOnboardingDate),
    client: client ?? { id: row.clientCompanyId, name: "unknown", code: "?" },
  };
}

export const RequisitionService = {
  async create(tenantId: string, userId: string, input: CreateRequisitionInput) {
    void userId;
    const client = await RequisitionRepo.findClient(tenantId, input.clientCompanyId);
    if (!client) {
      throw new NotFoundError("ClientCompany", input.clientCompanyId);
    }
    if (input.assignedRecruiterId) {
      const recruiter = await RequisitionRepo.findUser(
        tenantId,
        input.assignedRecruiterId
      );
      if (!recruiter) {
        throw new NotFoundError("User", input.assignedRecruiterId);
      }
    }

    const yyyymm = currentYyyymm();
    const prefix = reqCodePrefix({
      clientCode: client.code,
      countryCode: input.country,
      roleCategoryCode: input.roleCategory,
      yyyymm,
    });

    const attempt = async (seq: number) => {
      const reqCode = buildReqCode({
        clientCode: client.code,
        countryCode: input.country,
        roleCategoryCode: input.roleCategory,
        yyyymm,
        seq,
      });
      return RequisitionRepo.create(tenantId, {
        tenantId,
        clientCompanyId: input.clientCompanyId,
        reqCode,
        roleCategory: input.roleCategory,
        country: input.country,
        vacancyTarget: input.vacancyTarget,
        location: input.location,
        targetOnboardingDate: input.targetOnboardingDate,
        notes: input.notes,
        assignedRecruiterId: input.assignedRecruiterId,
        status: "OPEN",
      });
    };

    const max = await RequisitionRepo.findMaxSeqForPrefix(
      tenantId,
      input.clientCompanyId,
      prefix
    );
    try {
      return await attempt(max + 1);
    } catch (error) {
      if (!isP2002(error)) throw error;
      try {
        return await attempt(max + 2);
      } catch (retryError) {
        if (isP2002(retryError)) {
          throw new ConflictError("Req code collision after retry");
        }
        throw retryError;
      }
    }
  },

  async list(
    tenantId: string,
    filter: { status?: JobRequisition["status"]; clientCompanyId?: string; search?: string }
  ): Promise<RequisitionView[]> {
    const scope = tryGetScope();
    let branchUserIds: string[] | undefined;
    if (scope?.kind === "USER" && scope.role === "BRANCH_MANAGER" && scope.branchId) {
      branchUserIds = await loadBranchUserIds(tenantId, scope.branchId);
    }
    const scopeWhere = scope ? requisitionScopeFilter(scope, branchUserIds) : {};
    const rows = await RequisitionRepo.list(tenantId, filter, scopeWhere);
    const views: RequisitionView[] = [];
    for (const row of rows) {
      views.push(await toView(tenantId, row));
    }
    return views;
  },

  async getById(tenantId: string, id: string): Promise<RequisitionView> {
    const row = await RequisitionRepo.findById(tenantId, id);
    if (!row) throw new NotFoundError("JobRequisition", id);
    return toView(tenantId, row);
  },

  async update(
    tenantId: string,
    userId: string,
    id: string,
    patch: Omit<UpdateRequisitionInput, "id">
  ) {
    void userId;
    const updated = await RequisitionRepo.update(tenantId, id, patch);
    if (!updated) throw new NotFoundError("JobRequisition", id);
    return updated;
  },

  async assignRecruiter(
    tenantId: string,
    userId: string,
    id: string,
    recruiterId: string
  ): Promise<void> {
    void userId;
    const recruiter = await RequisitionRepo.findUser(tenantId, recruiterId);
    if (!recruiter) throw new NotFoundError("User", recruiterId);
    const updated = await RequisitionRepo.update(tenantId, id, {
      assignedRecruiterId: recruiterId,
    });
    if (!updated) throw new NotFoundError("JobRequisition", id);
  },

  async computeFulfillment(tenantId: string, id: string) {
    const row = await RequisitionRepo.findById(tenantId, id);
    if (!row) throw new NotFoundError("JobRequisition", id);
    const mobilized = await RequisitionRepo.countMobilized(tenantId, id);
    return {
      mobilized,
      target: row.vacancyTarget,
      pct: computeFulfillmentPct(mobilized, row.vacancyTarget),
    };
  },

  async softDelete(tenantId: string, userId: string, id: string) {
    void userId;
    const ok = await RequisitionRepo.softDelete(tenantId, id);
    if (!ok) throw new NotFoundError("JobRequisition", id);
  },
};

export { computeSlaFlag, computeFulfillmentPct };
