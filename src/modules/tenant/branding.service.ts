import { authPrisma } from "@/core/db/client";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";
import { getStorage } from "@/core/storage/storage.client";

export const BrandingService = {
  async update(
    tenantId: string,
    role: string,
    input: {
      displayName?: string;
      primaryColor?: string;
      defaultLocale?: string;
      logoUrl?: string | null;
      customDomain?: string | null;
    }
  ) {
    if (role !== "TENANT_ADMIN") throw new ForbiddenError("Role cannot manage branding");
    if (input.primaryColor && !/^#[0-9A-Fa-f]{6}$/.test(input.primaryColor)) {
      throw new ValidationError("Primary color must be hex");
    }
    if (input.defaultLocale && input.defaultLocale !== "en" && input.defaultLocale !== "ar") {
      throw new ValidationError("Locale must be en or ar");
    }
    let customDomain = input.customDomain;
    if (customDomain !== undefined) {
      customDomain = customDomain?.trim().toLowerCase() || null;
      if (customDomain && !/^[a-z0-9][a-z0-9.-]+\.[a-z]{2,}$/.test(customDomain)) {
        throw new ValidationError("Custom domain must be a valid hostname");
      }
    }
    const tenant = await authPrisma.tenant.findFirst({
      where: { id: tenantId, deletedAt: null },
    });
    if (!tenant) throw new NotFoundError("Tenant", tenantId);

    if (customDomain) {
      const taken = await authPrisma.tenant.findFirst({
        where: {
          customDomain,
          deletedAt: null,
          NOT: { id: tenantId },
        },
        select: { id: true },
      });
      if (taken) throw new ValidationError("That custom domain is already in use");
    }

    await authPrisma.tenant.updateMany({
      where: { id: tenantId },
      data: {
        displayName: input.displayName,
        primaryColor: input.primaryColor,
        defaultLocale: input.defaultLocale,
        defaultDirection:
          input.defaultLocale === "ar"
            ? "rtl"
            : input.defaultLocale === "en"
              ? "ltr"
              : undefined,
        ...(input.logoUrl !== undefined ? { logoUrl: input.logoUrl } : {}),
        ...(customDomain !== undefined ? { customDomain } : {}),
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
