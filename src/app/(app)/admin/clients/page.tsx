import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { withSessionScope } from "@/core/auth/action-scope";
import { ClientCompanyService } from "@/modules/client/client.company.service";
import { deleteClientCompanyAction } from "@/modules/client/client.company.actions";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";

export default async function ClientsPage() {
  const session = await requireSession();
  const tenantId = session.user.tenantId || session.tenantId;
  if (!tenantId) {
    return (
      <main className="space-y-6 p-6">
        <PageHeader title="Clients" />
        <p className="text-sm text-muted-foreground">Missing tenant</p>
      </main>
    );
  }

  const clients = await withSessionScope((_scope) =>
    ClientCompanyService.list(tenantId)
  );

  return (
    <main className="space-y-6 p-6">
      <PageHeader
        title="Clients"
        description="Client companies for requisitions and portal access"
        actions={
          <Link
            href="/admin/clients/new"
            className="rounded bg-neutral-900 px-3 py-2 text-sm text-white"
          >
            New client
          </Link>
        }
      />

      {clients.length === 0 ? (
        <EmptyState
          title="No clients yet"
          description="Create a client company before opening requisitions or inviting portal users."
          action={
            <Link
              href="/admin/clients/new"
              className="rounded bg-neutral-900 px-3 py-2 text-sm text-white"
            >
              Add client
            </Link>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-neutral-50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Code</th>
                <th className="px-3 py-2 font-medium">Country</th>
                <th className="px-3 py-2 font-medium">Users</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id} className="border-b last:border-0">
                  <td className="px-3 py-2 font-medium">{c.name}</td>
                  <td className="px-3 py-2 font-mono text-xs">{c.code}</td>
                  <td className="px-3 py-2">{c.country ?? "—"}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <Link
                        href={`/admin/clients/${c.id}/users`}
                        className="underline underline-offset-2"
                      >
                        Manage users
                      </Link>
                      <form action={deleteClientCompanyAction}>
                        <input type="hidden" name="id" value={c.id} />
                        <button type="submit" className="text-xs text-red-700 underline underline-offset-2">
                          Delete
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
