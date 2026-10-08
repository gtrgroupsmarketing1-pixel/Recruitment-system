import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/core/auth/session";
import { withSessionScope } from "@/core/auth/action-scope";
import { requirePermission } from "@/core/auth/permissions";
import { authPrisma } from "@/core/db/client";
import { ClientUserService } from "@/modules/client/client.user.service";
import { setClientUserActiveAction } from "@/modules/client/client.user.actions";

type Props = { params: Promise<{ id: string }> };

export default async function ClientUsersPage({ params }: Props) {
  const { id } = await params;
  const session = await requireSession();
  const tenantId = session.user.tenantId || session.tenantId;
  if (!tenantId) throw new Error("Missing tenant");
  const company = await authPrisma.clientCompany.findFirst({
    where: { id, tenantId, deletedAt: null },
  });
  if (!company) notFound();
  const users = await withSessionScope(async () => {
    requirePermission("client_user:manage");
    return ClientUserService.list(tenantId, id);
  });
  return (
    <main className="mx-auto grid max-w-3xl gap-4 p-6">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-neutral-500">{company.name}</p>
          <h1 className="text-xl font-semibold">Client users</h1>
        </div>
        <Link className="rounded border px-3 py-1" href={`/admin/clients/${id}/users/new`}>
          Add user
        </Link>
      </header>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left">
            <th>Email</th>
            <th>Name</th>
            <th>Created</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-t">
              <td>{user.email}</td>
              <td>{user.name}</td>
              <td>{user.createdAt.toISOString().slice(0, 10)}</td>
              <td>{user.isActive ? "Active" : "Inactive"}</td>
              <td>
                <form action={setClientUserActiveAction}>
                  <input type="hidden" name="clientCompanyId" value={id} />
                  <input type="hidden" name="userId" value={user.id} />
                  <input type="hidden" name="active" value={user.isActive ? "0" : "1"} />
                  <button className="underline">{user.isActive ? "Deactivate" : "Reactivate"}</button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
