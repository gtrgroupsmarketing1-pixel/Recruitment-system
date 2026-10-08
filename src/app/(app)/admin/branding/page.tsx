import { requireSession } from "@/core/auth/session";
import { withSessionScope } from "@/core/auth/action-scope";
import { requirePermission } from "@/core/auth/permissions";
import { BrandingService } from "@/modules/tenant/branding.service";
import { authPrisma } from "@/core/db/client";
import { redirect } from "next/navigation";

async function saveBranding(formData: FormData) {
  "use server";
  await withSessionScope(async (scope) => {
    requirePermission("tenant:manage_branding");
    await BrandingService.update(scope.tenantId, scope.role, {
      displayName: String(formData.get("displayName") ?? ""),
      primaryColor: String(formData.get("primaryColor") ?? ""),
      defaultLocale: String(formData.get("defaultLocale") ?? "en"),
    });
  });
  redirect("/admin/branding");
}

export default async function BrandingPage() {
  const session = await requireSession();
  const tenantId = session.user.tenantId || session.tenantId;
  if (!tenantId) throw new Error("Missing tenant");
  const tenant = await authPrisma.tenant.findFirst({ where: { id: tenantId } });
  return (
    <main className="mx-auto grid max-w-md gap-3 p-6">
      <h1 className="text-xl font-semibold">Branding</h1>
      <p>Subdomain: {tenant?.slug}</p>
      <form action={saveBranding} className="grid gap-2">
        <input name="displayName" defaultValue={tenant?.displayName ?? ""} className="rounded border px-2 py-1" />
        <input name="primaryColor" type="color" defaultValue={tenant?.primaryColor ?? "#0F62FE"} />
        <select name="defaultLocale" defaultValue={tenant?.defaultLocale ?? "en"} className="rounded border px-2 py-1">
          <option value="en">EN</option>
          <option value="ar">AR</option>
        </select>
        <input disabled placeholder="Custom domain is Session 30" className="rounded border px-2 py-1" />
        <button className="rounded bg-neutral-900 px-3 py-2 text-white">Save</button>
      </form>
    </main>
  );
}
