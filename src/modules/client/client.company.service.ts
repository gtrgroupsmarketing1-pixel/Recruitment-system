import { db } from "@/core/db/client";
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";
import { tryGetScope } from "@/core/auth/scope";

export type ClientCompanyView = {
  id: string;
  name: string;
  code: string;
  country: string | null;
  createdAt: Date;
};

function assertCanManageClients() {
  const scope = tryGetScope();
  if (!scope || scope.kind !== "USER") {
    throw new ForbiddenError("Only TENANT_ADMIN or BRANCH_MANAGER can manage clients");
  }
  const role = scope.role;
  if (role !== "TENANT_ADMIN" && role !== "BRANCH_MANAGER") {
    throw new ForbiddenError("Only TENANT_ADMIN or BRANCH_MANAGER can manage clients");
  }
}

function normalizeCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
}

export const ClientCompanyService = {
  async list(tenantId: string): Promise<ClientCompanyView[]> {
    const rows = await db.clientCompany.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true, code: true, country: true, createdAt: true },
    });
    return rows;
  },

  async getById(tenantId: string, id: string): Promise<ClientCompanyView> {
    const row = await db.clientCompany.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: { id: true, name: true, code: true, country: true, createdAt: true },
    });
    if (!row) throw new NotFoundError("ClientCompany", id);
    return row;
  },

  async create(
    tenantId: string,
    input: { name: string; code: string; country?: string | null }
  ): Promise<ClientCompanyView> {
    assertCanManageClients();
    const name = input.name.trim();
    const code = normalizeCode(input.code);
    const country = (input.country ?? "").trim().toUpperCase().slice(0, 2) || null;
    if (!name) throw new ValidationError("Name is required");
    if (code.length < 2) throw new ValidationError("Code must be at least 2 characters (A–Z, 0–9)");

    const existing = await db.clientCompany.findFirst({
      where: { tenantId, code, deletedAt: null },
      select: { id: true },
    });
    if (existing) throw new ConflictError(`Client code "${code}" already exists`);

    try {
      const row = await db.clientCompany.create({
        data: { tenantId, name, code, country },
        select: { id: true, name: true, code: true, country: true, createdAt: true },
      });
      return row;
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code?: string }).code === "P2002"
      ) {
        throw new ConflictError(`Client code "${code}" already exists`);
      }
      throw error;
    }
  },
};
