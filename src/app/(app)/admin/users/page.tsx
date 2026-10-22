import { requireSession } from "@/core/auth/session";
import { withSessionScope } from "@/core/auth/action-scope";
import { requirePermission } from "@/core/auth/permissions";
import { StaffUserService } from "@/modules/user/staff-user.service";
import {
  createStaffUserAction,
  updateStaffRoleAction,
  setStaffActiveAction,
} from "@/modules/user/staff-user.actions";
import { PageHeader } from "@/components/ui/page-header";

type Props = { searchParams: Promise<{ error?: string }> };

export default async function AdminUsersPage({ searchParams }: Props) {
  const sp = await searchParams;
  const session = await requireSession();
  const tenantId = session.user.tenantId || session.tenantId;
  if (!tenantId) throw new Error("Missing tenant");

  const { users, branches } = await withSessionScope(async (scope) => {
    requirePermission("user:invite");
    await StaffUserService.ensureDefaultBranch(scope.tenantId);
    const [u, b] = await Promise.all([
      StaffUserService.list(scope.tenantId),
      StaffUserService.listBranches(scope.tenantId),
    ]);
    return { users: u, branches: b };
  });

  const roles = StaffUserService.staffRoles();

  return (
    <main className="mx-auto grid max-w-4xl gap-6 p-6">
      <PageHeader
        title="Staff users"
        description="Invite staff and assign roles. Client portal users are managed under Clients."
      />

      {sp.error ? (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {sp.error}
        </p>
      ) : null}

      <section className="rounded-lg border p-4">
        <h2 className="mb-3 text-sm font-semibold">Company workflow</h2>
        <ol className="list-decimal space-y-1 ps-5 text-sm text-muted-foreground">
          <li>
            <strong className="text-foreground">Staff users</strong> — assign RECRUITER,
            COMPLIANCE, MOBILIZATION, etc. (this page)
          </li>
          <li>
            <strong className="text-foreground">Clients</strong> — create client companies, then
            client portal users
          </li>
          <li>
            <strong className="text-foreground">Requisitions</strong> — open vacancies against a
            client
          </li>
          <li>
            <strong className="text-foreground">Candidates</strong> — source, screen, shortlist,
            mobilize
          </li>
        </ol>
      </section>

      <form action={createStaffUserAction} className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2">
        <p className="sm:col-span-2 text-sm font-medium">Invite staff user</p>
        <label className="grid gap-1 text-sm">
          Name
          <input name="name" required className="rounded border px-2 py-1.5" />
        </label>
        <label className="grid gap-1 text-sm">
          Email
          <input name="email" type="email" required className="rounded border px-2 py-1.5" />
        </label>
        <label className="grid gap-1 text-sm">
          Temporary password
          <input
            name="password"
            type="password"
            required
            minLength={12}
            className="rounded border px-2 py-1.5"
          />
        </label>
        <label className="grid gap-1 text-sm">
          Role
          <select name="role" defaultValue="RECRUITER" className="rounded border px-2 py-1.5">
            {roles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm sm:col-span-2">
          Branch (required for BRANCH_MANAGER)
          <select name="branchId" defaultValue={branches[0]?.id ?? ""} className="rounded border px-2 py-1.5">
            <option value="">— none —</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
                {b.city ? ` · ${b.city}` : ""}
              </option>
            ))}
          </select>
        </label>
        <div className="sm:col-span-2">
          <button type="submit" className="rounded bg-neutral-900 px-3 py-2 text-sm text-white">
            Create staff user
          </button>
        </div>
      </form>

      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-neutral-50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Role</th>
              <th className="px-3 py-2">Branch</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b last:border-0">
                <td className="px-3 py-2 font-medium">{u.name}</td>
                <td className="px-3 py-2">{u.email}</td>
                <td className="px-3 py-2">
                  <form action={updateStaffRoleAction} className="flex flex-wrap items-center gap-1">
                    <input type="hidden" name="userId" value={u.id} />
                    <select
                      name="role"
                      defaultValue={u.role}
                      className="rounded border px-1 py-0.5 text-xs"
                    >
                      {roles.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                    <select
                      name="branchId"
                      defaultValue={u.branchId ?? ""}
                      className="rounded border px-1 py-0.5 text-xs"
                    >
                      <option value="">—</option>
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                    <button type="submit" className="text-xs underline">
                      Save
                    </button>
                  </form>
                </td>
                <td className="px-3 py-2 text-xs">{u.branchName ?? "—"}</td>
                <td className="px-3 py-2">{u.isActive ? "Active" : "Inactive"}</td>
                <td className="px-3 py-2">
                  <form action={setStaffActiveAction}>
                    <input type="hidden" name="userId" value={u.id} />
                    <input type="hidden" name="active" value={u.isActive ? "0" : "1"} />
                    <button type="submit" className="text-xs underline">
                      {u.isActive ? "Deactivate" : "Reactivate"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
