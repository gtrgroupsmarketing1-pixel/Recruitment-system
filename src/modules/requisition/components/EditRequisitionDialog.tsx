"use client";

import {
  updateRequisitionAction,
  deleteRequisitionAction,
} from "@/modules/requisition/update.action";
import type { RequisitionView } from "@/modules/requisition/requisition.service";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Props = { data: RequisitionView };

export function EditRequisitionDialog({ data }: Props) {
  const onboardInput = data.targetOnboardingDate
    ? data.targetOnboardingDate.toISOString().slice(0, 10)
    : "";

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>
        Edit requisition
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit requisition</DialogTitle>
          <DialogDescription>
            Update role, targets, SLA date, and status.
          </DialogDescription>
        </DialogHeader>
        <form action={updateRequisitionAction} className="grid gap-3">
          <input type="hidden" name="id" value={data.id} />
          <label className="grid gap-1 text-sm">
            Role category code
            <input
              name="roleCategory"
              defaultValue={data.roleCategory}
              className="h-8 rounded-lg border border-input bg-background px-2 font-mono uppercase"
            />
          </label>
          <label className="grid gap-1 text-sm">
            Country
            <select
              name="country"
              defaultValue={data.country}
              className="h-8 rounded-lg border border-input bg-background px-2"
            >
              {["AE", "SA", "QA", "KW", "BH", "OM"].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            Vacancy target
            <input
              name="vacancyTarget"
              type="number"
              min={1}
              defaultValue={data.vacancyTarget}
              className="h-8 rounded-lg border border-input bg-background px-2"
            />
          </label>
          <label className="grid gap-1 text-sm">
            Location
            <input
              name="location"
              defaultValue={data.location ?? ""}
              className="h-8 rounded-lg border border-input bg-background px-2"
            />
          </label>
          <label className="grid gap-1 text-sm">
            Target onboarding (SLA)
            <input
              name="targetOnboardingDate"
              type="date"
              defaultValue={onboardInput}
              className="h-8 rounded-lg border border-input bg-background px-2"
            />
          </label>
          <label className="grid gap-1 text-sm">
            Status
            <select
              name="status"
              defaultValue={data.status}
              className="h-8 rounded-lg border border-input bg-background px-2"
            >
              {["OPEN", "IN_PROGRESS", "FILLED", "CANCELLED", "ON_HOLD"].map(
                (s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                )
              )}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            Notes
            <input
              name="notes"
              defaultValue={data.notes ?? ""}
              className="h-8 rounded-lg border border-input bg-background px-2"
            />
          </label>
          <Button type="submit">Save changes</Button>
        </form>

        <details className="mt-4 rounded-lg border border-destructive/30 p-3">
          <summary className="cursor-pointer text-sm font-medium text-destructive">
            Danger zone
          </summary>
          <form action={deleteRequisitionAction} className="mt-3">
            <input type="hidden" name="id" value={data.id} />
            <p className="mb-2 text-xs text-muted-foreground">
              Soft-delete hides this requisition from lists.
            </p>
            <Button type="submit" variant="destructive" size="sm">
              Delete requisition
            </Button>
          </form>
        </details>
      </DialogContent>
    </Dialog>
  );
}
