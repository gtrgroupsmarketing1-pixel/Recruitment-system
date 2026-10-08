import bcrypt from "bcryptjs";
import type { UserRole } from "@prisma/client";
import { authPrisma } from "@/core/db/client";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { assertUserScope } from "@/modules/user/user.scope.guard";

export type ClientUserView = {
  id: string;
  email: string;
  name: string;
  clientCompanyId: string;
  createdAt: Date;
  isActive: boolean;
};

function toView(row: {
  id: string;
  email: string;
  name: string;
  clientCompanyId: string | null;
  createdAt: Date;
  deletedAt: Date | null;
}): ClientUserView {
  if (!row.clientCompanyId) {
    throw new ValidationError("CLIENT_USER requires clientCompanyId");
  }
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    clientCompanyId: row.clientCompanyId,
    createdAt: row.createdAt,
    isActive: row.deletedAt === null,
  };
}

export const ClientUserService = {
  async list(tenantId: string, clientCompanyId: string): Promise<ClientUserView[]> {
    const company = await authPrisma.clientCompany.findFirst({
      where: { id: clientCompanyId, tenantId, deletedAt: null },
    });
    if (!company) throw new NotFoundError("ClientCompany", clientCompanyId);
    const rows = await authPrisma.user.findMany({
      where: { tenantId, clientCompanyId, role: "CLIENT_USER" },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toView);
  },

  async create(
    tenantId: string,
    _actorUserId: string,
    input: {
      clientCompanyId: string;
      email: string;
      name: string;
      password: string;
      role?: UserRole;
    }
  ): Promise<ClientUserView> {
    if (input.role && input.role !== "CLIENT_USER") {
      throw new ValidationError("Client user admin can only create CLIENT_USER");
    }
    const email = input.email.trim().toLowerCase();
    const name = input.name.trim();
    if (!email || !name) throw new ValidationError("Name and email are required");
    if (input.password.length < 12) {
      throw new ValidationError("Password must be at least 12 characters");
    }
    const company = await authPrisma.clientCompany.findFirst({
      where: { id: input.clientCompanyId, tenantId, deletedAt: null },
    });
    if (!company) throw new NotFoundError("ClientCompany", input.clientCompanyId);
    const existing = await authPrisma.user.findFirst({
      where: { tenantId, email },
    });
    if (existing) throw new ValidationError("Email already used in this tenant");
    assertUserScope({
      role: "CLIENT_USER",
      branchId: null,
      clientCompanyId: input.clientCompanyId,
    });
    const passwordHash = await bcrypt.hash(input.password, 12);
    try {
      const row = await authPrisma.user.create({
        data: {
          tenantId,
          email,
          name,
          passwordHash,
          role: "CLIENT_USER",
          branchId: null,
          clientCompanyId: input.clientCompanyId,
        },
      });
      return toView(row);
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code: string }).code === "P2002"
      ) {
        throw new ValidationError("Email already used in this tenant");
      }
      throw error;
    }
  },

  async deactivate(tenantId: string, _actorUserId: string, userId: string): Promise<void> {
    const row = await authPrisma.user.findFirst({
      where: { id: userId, tenantId, role: "CLIENT_USER" },
    });
    if (!row) throw new NotFoundError("User", userId);
    await authPrisma.user.updateMany({
      where: { id: userId, tenantId, role: "CLIENT_USER" },
      data: { deletedAt: new Date() },
    });
  },

  async reactivate(tenantId: string, _actorUserId: string, userId: string): Promise<void> {
    const row = await authPrisma.user.findFirst({
      where: { id: userId, tenantId, role: "CLIENT_USER" },
    });
    if (!row) throw new NotFoundError("User", userId);
    await authPrisma.user.updateMany({
      where: { id: userId, tenantId, role: "CLIENT_USER" },
      data: { deletedAt: null },
    });
  },
};
