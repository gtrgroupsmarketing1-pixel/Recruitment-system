import { db } from "@/core/db/client";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { getUserScope } from "@/core/auth/scope";
import { clientApplicationFilter, clientRequisitionFilter } from "@/core/auth/scope-filter";
import { projectClientCandidate, type ClientCandidateView } from "./client.projection";
import { PIPELINE_ORDER } from "@/modules/application/application.status-order";
import { STATUS, type Status } from "@/modules/application/application.state-machine";

function requireClientCompany(): string {
  const scope = getUserScope();
  if (scope.role !== "CLIENT_USER" || !scope.clientCompanyId) {
    throw new ForbiddenError("Client company scope required");
  }
  return scope.clientCompanyId;
}

const shortlistFrom = PIPELINE_ORDER.indexOf(STATUS.SHORTLISTED);
const deployedFrom = PIPELINE_ORDER.indexOf(STATUS.MOBILIZED);

export const ClientPortalService = {
  async listRequisitions(tenantId: string) {
    requireClientCompany();
    const scope = getUserScope();
    return db.jobRequisition.findMany({
      where: { tenantId, deletedAt: null, ...clientRequisitionFilter(scope) },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        reqCode: true,
        roleCategory: true,
        country: true,
        vacancyTarget: true,
        status: true,
      },
    });
  },

  async getRequisition(tenantId: string, id: string) {
    requireClientCompany();
    const scope = getUserScope();
    const row = await db.jobRequisition.findFirst({
      where: { id, tenantId, deletedAt: null, ...clientRequisitionFilter(scope) },
      select: {
        id: true,
        reqCode: true,
        roleCategory: true,
        country: true,
        vacancyTarget: true,
        status: true,
      },
    });
    if (!row) throw new NotFoundError("JobRequisition", id);
    return row;
  },

  async listShortlist(tenantId: string, requisitionId: string): Promise<ClientCandidateView[]> {
    await this.getRequisition(tenantId, requisitionId);
    const scope = getUserScope();
    const apps = await db.candidateApplication.findMany({
      where: {
        tenantId,
        requisitionId,
        deletedAt: null,
        ...clientApplicationFilter(scope),
      },
      include: {
        candidate: { select: { id: true, fullName: true } },
        requisition: { select: { roleCategory: true } },
      },
    });
    return apps
      .filter((a) => PIPELINE_ORDER.indexOf(a.status as Status) >= shortlistFrom)
      .map((a) =>
        projectClientCandidate({
          applicationId: a.id,
          candidateId: a.candidateId,
          fullName: a.candidate.fullName,
          roleCategory: a.requisition.roleCategory,
          currentStatus: a.status,
        })
      );
  },

  async listDeployments(tenantId: string) {
    requireClientCompany();
    const scope = getUserScope();
    const apps = await db.candidateApplication.findMany({
      where: { tenantId, deletedAt: null, ...clientApplicationFilter(scope) },
      include: {
        candidate: { select: { id: true, fullName: true } },
        requisition: { select: { roleCategory: true, reqCode: true } },
      },
    });
    return apps
      .filter((a) => PIPELINE_ORDER.indexOf(a.status as Status) >= deployedFrom)
      .map((a) => ({
        ...projectClientCandidate({
          applicationId: a.id,
          candidateId: a.candidateId,
          fullName: a.candidate.fullName,
          roleCategory: a.requisition.roleCategory,
          currentStatus: a.status,
        }),
        reqCode: a.requisition.reqCode,
      }));
  },
};
