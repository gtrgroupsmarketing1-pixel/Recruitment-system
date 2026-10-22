"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createRequisitionAction,
  type CreateFormState,
} from "@/modules/requisition/create.action";

export type ClientOption = { id: string; name: string; code: string };

type Props = {
  clientCompanyId?: string;
  clients: ClientOption[];
};

export function CreateRequisitionForm({ clientCompanyId, clients }: Props) {
  const [state, formAction, isPending] = useActionState<
    CreateFormState,
    FormData
  >(createRequisitionAction, {});

  if (clients.length === 0) {
    return (
      <div className="grid max-w-md gap-3 rounded border border-dashed p-4 text-sm">
        <p className="font-medium">No client companies yet</p>
        <p className="text-muted-foreground">
          Create a client before opening a requisition.
        </p>
        <Link
          href="/admin/clients/new"
          className="inline-flex w-fit rounded bg-neutral-900 px-3 py-2 text-white"
        >
          Add client
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="grid max-w-md gap-3">
      <Label htmlFor="clientCompanyId">Client company</Label>
      <select
        id="clientCompanyId"
        name="clientCompanyId"
        required
        defaultValue={clientCompanyId ?? clients[0]?.id ?? ""}
        className="rounded border px-3 py-2"
      >
        {clients.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name} ({c.code})
          </option>
        ))}
      </select>
      {state.errors?.clientCompanyId ? (
        <p className="text-sm text-red-700">{state.errors.clientCompanyId[0]}</p>
      ) : null}

      <Label htmlFor="country">Country</Label>
      <select
        id="country"
        name="country"
        className="rounded border px-3 py-2"
        required
        defaultValue="AE"
      >
        <option value="AE">AE</option>
        <option value="SA">SA</option>
        <option value="QA">QA</option>
        <option value="KW">KW</option>
        <option value="BH">BH</option>
        <option value="OM">OM</option>
      </select>

      <Label htmlFor="jobTitle">Job title</Label>
      <Input id="jobTitle" name="jobTitle" placeholder="e.g. Heavy Driver" required />

      <Label htmlFor="roleCategory">Role category code</Label>
      <Input id="roleCategory" name="roleCategory" defaultValue="BC" required />
      <p className="text-xs text-muted-foreground">2–4 uppercase letters/numbers used in req codes (e.g. BC, DRV).</p>

      <Label htmlFor="vacancyTarget">Vacancy target</Label>
      <Input id="vacancyTarget" name="vacancyTarget" type="number" required />
      {state.errors?.vacancyTarget ? (
        <p className="text-sm text-red-700">{state.errors.vacancyTarget[0]}</p>
      ) : null}

      <Label htmlFor="location">Location</Label>
      <Input id="location" name="location" />

      <Label htmlFor="targetOnboardingDate">Target onboarding</Label>
      <Input id="targetOnboardingDate" name="targetOnboardingDate" type="date" />

      <Label htmlFor="notes">Notes</Label>
      <Input id="notes" name="notes" />

      <Button>{isPending ? "Saving…" : "Create requisition"}</Button>
      {state.errors?.form ? (
        <p className="text-sm text-red-700">{state.errors.form[0]}</p>
      ) : null}
    </form>
  );
}
