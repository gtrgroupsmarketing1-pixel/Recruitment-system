import { requireSession } from "@/core/auth/session";
import { withSessionScope } from "@/core/auth/action-scope";
import { requirePermission } from "@/core/auth/permissions";
import { StaffUserService } from "@/modules/user/staff-user.service";
import { InviteStaffDialog } from "@/modules/user/components/InviteStaffDialog";
import { StaffTable } from "@/modules/user/components/StaffTable";
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
    <main className="space-y-6 p-6">
      <PageHeader
        title="Staff users"
        description="Roles, branches, and workload. Client portal users live under Clients."
        actions={<InviteStaffDialog roles={roles} branches={branches} />}
      />

      {sp.error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {sp.error}
        </p>
      ) : null}

      <StaffTable users={users} roles={roles} branches={branches} />
    </main>
  );
}
