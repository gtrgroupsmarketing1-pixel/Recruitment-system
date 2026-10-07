import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { withTenant } from "@/core/db/client";
import { ComplianceTemplateService } from "@/modules/compliance/compliance.template.service";

export default async function TemplatesPage() {
  const session = await requireSession();
  const tenantId = session.user.tenantId || session.tenantId;
  if (!tenantId) return <main className="p-8">Missing tenant</main>;
  const rows = await withTenant(tenantId, () =>
    ComplianceTemplateService.listTemplates(tenantId, { active: true })
  );
  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Compliance templates</h1>
        <Link href="/compliance/templates/new" className="text-sm underline">
          New template
        </Link>
      </div>
      <ul className="grid gap-2">
        {rows.map((row) => (
          <li key={row.id} className="rounded border p-3 text-sm">
            <Link href={`/compliance/templates/${row.id}`} className="font-medium">
              {row.name}
            </Link>
            <p className="text-xs text-neutral-500">
              {row.originCountry} → {row.destinationCountry} · {row.roleCategory}
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}
