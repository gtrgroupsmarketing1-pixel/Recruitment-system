"use client";

import type { UserRole } from "@prisma/client";
import { createStaffUserAction } from "@/modules/user/staff-user.actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Branch = { id: string; name: string };

type Props = {
  roles: readonly UserRole[];
  branches: Branch[];
};

export function InviteStaffDialog({ roles, branches }: Props) {
  return (
    <Dialog>
      <DialogTrigger render={<Button />}>+ Invite staff</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite staff user</DialogTitle>
          <DialogDescription>
            Creates a login with a temporary password. Share credentials securely.
          </DialogDescription>
        </DialogHeader>
        <form action={createStaffUserAction} className="grid gap-3">
          <label className="grid gap-1 text-sm">
            Name
            <input
              name="name"
              required
              className="h-8 rounded-lg border border-input bg-background px-2"
            />
          </label>
          <label className="grid gap-1 text-sm">
            Email
            <input
              name="email"
              type="email"
              required
              className="h-8 rounded-lg border border-input bg-background px-2"
            />
          </label>
          <label className="grid gap-1 text-sm">
            Temporary password (min 12 chars)
            <input
              name="password"
              type="password"
              required
              minLength={12}
              className="h-8 rounded-lg border border-input bg-background px-2"
            />
          </label>
          <label className="grid gap-1 text-sm">
            Role
            <select
              name="role"
              defaultValue="RECRUITER"
              className="h-8 rounded-lg border border-input bg-background px-2"
            >
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            Branch (optional)
            <select
              name="branchId"
              defaultValue=""
              className="h-8 rounded-lg border border-input bg-background px-2"
            >
              <option value="">—</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
          <Button type="submit">Create user</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
