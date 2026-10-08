import type { Prisma } from "@prisma/client";
import type { Scope, SessionScope } from "./scope";

/**
 * Pure helpers returning Prisma where fragments for scope-based visibility.
 * SYSTEM scope and TENANT_ADMIN see everything (empty filter).
 * BRANCH_MANAGER filters by users in the same branch (caller supplies branchUserIds).
 */

function isUserScope(scope: Scope): scope is SessionScope {
  return scope.kind === "USER";
}

/**
 * @param branchUserIds — user IDs in the same branch as the session user.
 *   Required when role is BRANCH_MANAGER; ignored otherwise.
 */
export function applicationScopeFilter(
  scope: Scope,
  branchUserIds?: string[]
): Prisma.CandidateApplicationWhereInput {
  if (!isUserScope(scope)) return {};
  if (scope.role === "TENANT_ADMIN") return {};
  if (scope.role === "BRANCH_MANAGER") {
    if (!branchUserIds?.length) return { id: "__impossible__" };
    return { recruiterId: { in: branchUserIds } };
  }
  if (scope.role === "RECRUITER") {
    return { recruiterId: scope.userId };
  }
  // MOBILIZATION_OFFICER, COMPLIANCE_OFFICER, FINANCE: all (read)
  return {};
}

export function candidateScopeFilter(
  scope: Scope,
  branchUserIds?: string[]
): Prisma.CandidateWhereInput {
  if (!isUserScope(scope)) return {};
  if (scope.role === "TENANT_ADMIN") return {};
  if (scope.role === "BRANCH_MANAGER") {
    if (!branchUserIds?.length) return { id: "__impossible__" };
    return {
      applications: { some: { recruiterId: { in: branchUserIds } } },
    };
  }
  if (scope.role === "RECRUITER") {
    return {
      applications: { some: { recruiterId: scope.userId } },
    };
  }
  return {};
}

export function requisitionScopeFilter(
  scope: Scope,
  branchUserIds?: string[]
): Prisma.JobRequisitionWhereInput {
  if (!isUserScope(scope)) return {};
  if (scope.role === "TENANT_ADMIN") return {};
  if (scope.role === "BRANCH_MANAGER") {
    if (!branchUserIds?.length) return { id: "__impossible__" };
    return {
      OR: [
        { assignedRecruiterId: { in: branchUserIds } },
        {
          applications: {
            some: { recruiterId: { in: branchUserIds } },
          },
        },
      ],
    };
  }
  if (scope.role === "RECRUITER") {
    return {
      OR: [
        { assignedRecruiterId: scope.userId },
        { applications: { some: { recruiterId: scope.userId } } },
      ],
    };
  }
  return {};
}

export function taskScopeFilter(
  scope: Scope,
  branchUserIds?: string[]
): Prisma.TaskWhereInput {
  if (!isUserScope(scope)) return {};
  if (scope.role === "TENANT_ADMIN") return {};
  if (scope.role === "BRANCH_MANAGER") {
    if (!branchUserIds?.length) return { id: "__impossible__" };
    return { assigneeId: { in: branchUserIds } };
  }
  // Everyone else: own tasks only (including COMPLIANCE view-all via task:view_all)
  if (
    scope.role === "COMPLIANCE_OFFICER" ||
    scope.role === "MOBILIZATION_OFFICER" ||
    scope.role === "FINANCE" ||
    scope.role === "RECRUITER"
  ) {
    return { assigneeId: scope.userId };
  }
  return { assigneeId: scope.userId };
}

/**
 * Resolve user IDs that share the same branch as the scope user.
 * Returns empty array when branchId is null (no branch → no branch peers).
 */
export async function resolveBranchUserIds(
  listUserIdsInBranch: (
    tenantId: string,
    branchId: string
  ) => Promise<string[]>,
  scope: SessionScope
): Promise<string[] | undefined> {
  if (scope.role !== "BRANCH_MANAGER" || !scope.branchId) {
    return undefined;
  }
  return listUserIdsInBranch(scope.tenantId, scope.branchId);
}

/** Load user ids in a branch (for BRANCH_MANAGER scope filters). */
export async function loadBranchUserIds(
  tenantId: string,
  branchId: string
): Promise<string[]> {
  const { db } = await import("@/core/db/client");
  const users = await db.user.findMany({
    where: { tenantId, branchId, deletedAt: null },
    select: { id: true },
  });
  return users.map((u) => u.id);
}
