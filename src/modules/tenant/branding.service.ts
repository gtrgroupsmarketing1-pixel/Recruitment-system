import { authPrisma } from "@/core/db/client";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";
import { getStorage } from "@/core/storage/storage.client";

export const BrandingService = {
  async update(
    tenantId: string,
    role: string,
    input: { displayName?: string; primaryColor?: string; defaultLocale?: string; logoKey?: string }
  ) {
    if (role !== "TENANT_ADMIN") throw new ForbiddenError("Role cannot manage branding");
    if (input.primaryColor && !/^#[0-9A-Fa-f]{6}$/.test(input.primaryColor)) {
      throw new ValidationError("Primary color must be hex");
    }
    if (input.defaultLocale && input.defaultLocale !== "en" && input.defaultLocale !== "ar") {
      throw new ValidationError("Locale must be en or ar");
    }
    const tenant = await authPrisma.tenant.findFirst({ where: { id: tenantId, deletedAt: null } });
    if (!tenant) throw new NotFoundError("Tenant", tenantId);
    await authPrisma.tenant.updateMany({
      where: { id: tenantId },
      data: {
        displayName: input.displayName,
        primaryColor: input.primaryColor,
        defaultLocale: input.defaultLocale,
        defaultDirection: input.defaultLocale === "ar" ? "rtl" : input.defaultLocale === "en" ? "ltr" : undefined,
        logoUrl: input.logoKey,
      },
    });
  },

  async uploadLogo(tenantId: string, role: string, fileName: string, mimeType: string) {
    if (role !== "TENANT_ADMIN") throw new ForbiddenError("Role cannot manage branding");
    const key = `tenants/${tenantId}/branding/${fileName}`;
    const uploadUrl = await getStorage().getSignedUploadUrl(key, mimeType, 900);
    return { key, uploadUrl };
  },
};
