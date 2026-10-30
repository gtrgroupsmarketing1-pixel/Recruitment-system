"use client";

import { createClientCompanyAction } from "@/modules/client/client.company.actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function NewClientDialog() {
  return (
    <Dialog>
      <DialogTrigger render={<Button />}>New client</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New client company</DialogTitle>
          <DialogDescription>
            Used for requisitions and client portal access.
          </DialogDescription>
        </DialogHeader>
        <form action={createClientCompanyAction} className="grid gap-3">
          <label className="grid gap-1 text-sm">
            Name
            <input
              name="name"
              required
              placeholder="e.g. Ejar Facilities"
              className="h-8 rounded-lg border border-input bg-background px-2"
            />
          </label>
          <label className="grid gap-1 text-sm">
            Code
            <input
              name="code"
              required
              placeholder="e.g. EJAR"
              className="h-8 rounded-lg border border-input bg-background px-2 font-mono uppercase"
            />
          </label>
          <label className="grid gap-1 text-sm">
            Country
            <select
              name="country"
              defaultValue="AE"
              className="h-8 rounded-lg border border-input bg-background px-2"
            >
              {["AE", "SA", "QA", "KW", "BH", "OM"].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <Button type="submit">Create client</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
