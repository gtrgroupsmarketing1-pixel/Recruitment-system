import { db } from "@/core/db/client";
import { ValidationError } from "@/lib/errors";
import bcrypt from "bcryptjs";

export type SignupInput = {
  tenantName: string;
  slug: string;
  adminEmail: string;
  adminName: string;
  password: string;
};

export const TenantService = {
  async signup(input: SignupInput) {
    const tenantName = input.tenantName.trim();
    const slug = input.slug.trim().toLowerCase();
    const adminEmail = input.adminEmail.trim().toLowerCase();
    const adminName = input.adminName.trim();
    if (!tenantName || !slug || !adminEmail || !adminName || input.password.length < 8) {
      throw new ValidationError("Tenant name, slug, admin name, email, and an 8+ character password are required");
    }

    const existing = await db.tenant.findFirst({ where: { slug, deletedAt: null } });
    if (existing) {
      throw new ValidationError("Slug already taken");
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    try {
      return await db.$transaction(async (tx) => {
        const tenant = await tx.tenant.create({
          data: { name: tenantName, slug },
        });
        const user = await tx.user.create({
          data: {
            tenantId: tenant.id,
            email: adminEmail,
            name: adminName,
            passwordHash,
            role: "TENANT_ADMIN",
          },
        });
        return { tenant, user };
      });
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code: string }).code === "P2002"
      ) {
        throw new ValidationError("Slug already taken");
      }
      throw error;
    }
  },
};
