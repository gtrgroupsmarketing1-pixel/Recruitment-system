import { requireSession } from "@/core/auth/session";
import { authPrisma } from "@/core/db/client";
import { BrandingStudio } from "@/modules/tenant/components/BrandingStudio";
import { PageHeader } from "@/components/ui/page-header";

export default async function BrandingPage() {
  const session = await requireSession();
  const tenantId = session.user.tenantId || session.tenantId;
  if (!tenantId) throw new Error("Missing tenant");
  const tenant = await authPrisma.tenant.findFirst({
    where: { id: tenantId, deletedAt: null },
  });
  if (!tenant) throw new Error("Tenant not found");

  return (
    <main className="space-y-6 p-6">
      <PageHeader
        title="Branding"
        description="White-label identity for client portal and emails"
      />
      <BrandingStudio
        initial={{
          slug: tenant.slug,
          displayName: tenant.displayName ?? tenant.name,
          primaryColor: tenant.primaryColor ?? "#0F62FE",
          defaultLocale: tenant.defaultLocale ?? "en",
          logoUrl: tenant.logoUrl ?? "",
          customDomain: tenant.customDomain ?? "",
          rootDomain: process.env.ROOT_DOMAIN ?? "localhost",
        }}
      />
    </main>
  );
}
