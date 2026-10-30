"use client";

import { useTransition } from "react";
import type { UserRole } from "@prisma/client";
import type { StaffUserView } from "@/modules/user/staff-user.service";
import {
  updateStaffRoleAction,
  setStaffActiveAction,
} from "@/modules/user/staff-user.actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "cn";

type Branch = { id: string; name: string };

type Props = {
  users: StaffUserView[];
  roles: readonly UserRole[];
  branches: Branch[];
};

export function StaffTable({ users, roles, branches }: Props) {
  const [pending, startTransition] = useTransition();

  const onRoleChange = (userId: string, role: string, branchId: string | null) => {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("userId", userId);
      fd.set("role", role);
      if (branchId) fd.set("branchId", branchId);
      await updateStaffRoleAction(fd);
    });
  };

  return (
    <div className={cn("overflow-hidden rounded-lg border bg-card", pending && "opacity-80")}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Branch</TableHead>
            <TableHead>Workload</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => (
            <TableRow key={u.id}>
              <TableCell>
                <div className="font-medium">{u.name}</div>
                <div className="text-xs text-muted-foreground">{u.email}</div>
              </TableCell>
              <TableCell>
                <select
                  defaultValue={u.role}
                  disabled={pending}
                  className="h-8 rounded-lg border border-input bg-background px-2 text-xs"
                  onChange={(e) =>
                    onRoleChange(u.id, e.target.value, u.branchId)
                  }
                >
                  {roles.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </TableCell>
              <TableCell>
                <select
                  defaultValue={u.branchId ?? ""}
                  disabled={pending}
                  className="h-8 max-w-[8rem] rounded-lg border border-input bg-background px-2 text-xs"
                  onChange={(e) =>
                    onRoleChange(u.id, u.role, e.target.value || null)
                  }
                >
                  <option value="">—</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-[10px]">
                    {u.openRequisitions} reqs
                  </Badge>
                  <Badge
                    variant={u.openTasks > 20 ? "destructive" : "secondary"}
                    className="text-[10px]"
                  >
                    {u.openTasks} tasks
                  </Badge>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={u.isActive ? "default" : "secondary"}>
                  {u.isActive ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <form action={setStaffActiveAction}>
                  <input type="hidden" name="userId" value={u.id} />
                  <input
                    type="hidden"
                    name="active"
                    value={u.isActive ? "0" : "1"}
                  />
                  <button
                    type="submit"
                    className={cn(
                      u.isActive
                        ? "text-sm text-destructive hover:underline"
                        : "text-sm text-primary hover:underline"
                    )}
                  >
                    {u.isActive ? "Deactivate" : "Reactivate"}
                  </button>
                </form>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
