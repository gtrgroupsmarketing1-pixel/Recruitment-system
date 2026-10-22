import bcrypt from "bcryptjs";
import type { UserRole } from "@prisma/client";
import { authPrisma } from "@/core/db/client";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";
import { tryGetScope } from "@/core/auth/scope";
import { assertUserScope } from "@/modules/user/user.scope.guard";

const STAFF_ROLES: readonly UserRole[] = [
  "TENANT_ADMIN",
  "BRANCH_MANAGER",
  "RECRUITER",
  "MOBILIZATION_OFFICER",
  "COMPLIANCE_OFFICER",
  "FINANCE",
] as const;

export type StaffUserView = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  branchId: string | null;
  branchName: string | null;
  createdAt: Date;
  isActive: boolean;
};

function assertTenantAdmin() {
  const scope = tryGetScope();
  if (!scope || scope.kind !== "USER" || scope.role !== "TENANT_ADMIN") {
    throw new ForbiddenError("Only TENANT_ADMIN can manage staff users");
  }
}

function isStaffRole(role: string): role is UserRole {
  return (STAFF_ROLES as readonly string[]).includes(role);
}

export const StaffUserService = {
  staffRoles(): readonly UserRole[] {
    return STAFF_ROLES;
  },

  async listBranches(tenantId: string) {
    return authPrisma.branch.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true, city: true, country: true },
    });
  },

  async list(tenantId: string): Promise<StaffUserView[]> {
    const rows = await authPrisma.user.findMany({
      where: {
        tenantId,
        role: { in: [...STAFF_ROLES] },
      },
      orderBy: { createdAt: "desc" },
      include: { branch: { select: { name: true } } },
    });
    return rows.map((row) => ({
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role,
      branchId: row.branchId,
      branchName: row.branch?.name ?? null,
      createdAt: row.createdAt,
      isActive: row.deletedAt === null,
    }));
  },

  async create(
    tenantId: string,
    _actorUserId: string,
    input: {
      email: string;
      name: string;
      password: string;
      role: UserRole;
      branchId?: string | null;
    }
  ): Promise<StaffUserView> {
    assertTenantAdmin();
    if (!isStaffRole(input.role)) {
      throw new ValidationError("Invalid staff role");
    }
    const email = input.email.trim().toLowerCase();
    const name = input.name.trim();
    if (!email || !name) throw new ValidationError("Name and email are required");
    if (input.password.length < 12) {
      throw new ValidationError("Password must be at least 12 characters");
    }

    let branchId = input.branchId?.trim() || null;
    if (input.role === "BRANCH_MANAGER" && !branchId) {
      throw new ValidationError("BRANCH_MANAGER requires a branch");
    }
    if (branchId) {
      const branch = await authPrisma.branch.findFirst({
        where: { id: branchId, tenantId, deletedAt: null },
      });
      if (!branch) throw new NotFoundError("Branch", branchId);
    } else {
      branchId = null;
    }

    assertUserScope({
      role: input.role,
      branchId,
      clientCompanyId: null,
    });

    const existing = await authPrisma.user.findFirst({ where: { tenantId, email } });
    if (existing) throw new ValidationError("Email already used in this tenant");

    const passwordHash = await bcrypt.hash(input.password, 12);
    const row = await authPrisma.user.create({
      data: {
        tenantId,
        email,
        name,
        passwordHash,
        role: input.role,
        branchId,
        clientCompanyId: null,
      },
      include: { branch: { select: { name: true } } },
    });
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role,
      branchId: row.branchId,
      branchName: row.branch?.name ?? null,
      createdAt: row.createdAt,
      isActive: true,
    };
  },

  async updateRole(
    tenantId: string,
    _actorUserId: string,
    userId: string,
    role: UserRole,
    branchId?: string | null
  ): Promise<void> {
    assertTenantAdmin();
    if (!isStaffRole(role)) throw new ValidationError("Invalid staff role");

    const row = await authPrisma.user.findFirst({
      where: { id: userId, tenantId, role: { in: [...STAFF_ROLES] } },
    });
    if (!row) throw new NotFoundError("User", userId);

    let nextBranch = branchId === undefined ? row.branchId : branchId?.trim() || null;
    if (role === "BRANCH_MANAGER" && !nextBranch) {
      throw new ValidationError("BRANCH_MANAGER requires a branch");
    }
    if (role !== "BRANCH_MANAGER" && role !== "RECRUITER") {
      // optional branch for other roles; clear if not manager
      if (role === "TENANT_ADMIN" || role === "FINANCE") nextBranch = null;
    }
    if (nextBranch) {
      const branch = await authPrisma.branch.findFirst({
        where: { id: nextBranch, tenantId, deletedAt: null },
      });
      if (!branch) throw new NotFoundError("Branch", nextBranch);
    }

    assertUserScope({ role, branchId: nextBranch, clientCompanyId: null });

    await authPrisma.user.updateMany({
      where: { id: userId, tenantId },
      data: { role, branchId: nextBranch, clientCompanyId: null },
    });
  },

  async setActive(
    tenantId: string,
    _actorUserId: string,
    userId: string,
    active: boolean
  ): Promise<void> {
    assertTenantAdmin();
    const row = await authPrisma.user.findFirst({
      where: { id: userId, tenantId, role: { in: [...STAFF_ROLES] } },
    });
    if (!row) throw new NotFoundError("User", userId);
    await authPrisma.user.updateMany({
      where: { id: userId, tenantId },
      data: { deletedAt: active ? null : new Date() },
    });
  },

  async ensureDefaultBranch(tenantId: string, name = "Head office") {
    const existing = await authPrisma.branch.findFirst({
      where: { tenantId, deletedAt: null },
      orderBy: { createdAt: "asc" },
    });
    if (existing) return existing;
    return authPrisma.branch.create({
      data: { tenantId, name, country: "AE" },
    });
  },
};
