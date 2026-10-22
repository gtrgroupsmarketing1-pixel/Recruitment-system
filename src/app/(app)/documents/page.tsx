import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { withSessionScope } from "@/core/auth/action-scope";
import { DocumentService } from "@/modules/document/document.service";
import { DocumentList } from "@/modules/document/components/DocumentList";
import { PageHeader } from "@/components/ui/page-header";

export default async function DocumentsPage() {
  const session = await requireSession();
  const tenantId = session.user.tenantId || session.tenantId;
  if (!tenantId) throw new Error("Missing tenant");

  const [recent, expiring, pending] = await withSessionScope(async () => {
    const r = await DocumentService.listRecent(tenantId, 40);
    const e = await DocumentService.listExpiring(30);
    const p = await DocumentService.listPendingConfirm(tenantId, 20);
    return [r, e.filter((row) => row.tenantId === tenantId), p] as const;
  });

  return (
    <main className="mx-auto grid max-w-3xl gap-8 p-4 sm:p-6">
      <PageHeader
        title="Documents"
        description="Tenant document vault: recent uploads, expiring files, and incomplete uploads. Upload CV and IDs from a candidate profile."
        actions={
          <Link href="/candidates" className="text-sm underline underline-offset-2">
            Candidates
          </Link>
        }
      />

      <section className="space-y-2">
        <h2 className="text-sm font-semibold">How to upload</h2>
        <ol className="list-decimal space-y-1 ps-5 text-sm text-muted-foreground">
          <li>Open a candidate (Candidates → profile).</li>
          <li>Use Documents / CV on the profile to request an upload.</li>
          <li>Expiring passports and medicals appear in the section below.</li>
        </ol>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold">Expiring within 30 days</h2>
        <DocumentList documents={expiring} staff />
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold">Recent confirmed</h2>
        <DocumentList documents={recent} staff />
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold">Pending confirmation</h2>
        {pending.length === 0 ? (
          <p className="text-sm text-muted-foreground">No pending uploads.</p>
        ) : (
          <ul className="divide-y rounded border text-sm">
            {pending.map((d) => (
              <li key={d.id} className="flex justify-between gap-2 px-3 py-2">
                <span>
                  {d.label} · {d.fileName}
                </span>
                <span className="text-muted-foreground">{d.type}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
