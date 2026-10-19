"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createRequisitionAction,
  type CreateFormState,
} from "@/modules/requisition/create.action";

type ClientCompanyOption = { id: string; name: string; code: string };

type Props = {
  clientCompanyId?: string;
  clients: ClientCompanyOption[];
};

export function CreateRequisitionForm({
  clientCompanyId,
  clients,
}: Props) {
  const [state, formAction, isPending] = useActionState<
    CreateFormState,
    FormData
  >(createRequisitionAction, {});

  return (
    <form action={formAction} className="grid max-w-md gap-3">
      <Label htmlFor="clientCompanyId">Client company</Label>
      {clients.length === 0 ? (
        <p className="text-sm text-red-700">
          Please create a client company first in Admin &gt; Clients.
        </p>
      ) : (
        <>
          <select
            id="clientCompanyId"
            name="clientCompanyId"
            defaultValue={clientCompanyId ?? ""}
            required
            className="rounded border px-3 py-2"
          >
            <option value="">Select a client</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name} ({client.code})
              </option>
            ))}
          </select>
          {state.errors?.clientCompanyId ? (
            <p className="text-sm text-red-700">{state.errors.clientCompanyId[0]}</p>
          ) : null}
        </>
      )}

      <Label htmlFor="country">Country</Label>
      <select id="country" name="country" className="rounded border px-3 py-2" required defaultValue="AE">
        <option value="AE">AE</option>
        <option value="SA">SA</option>
        <option value="QA">QA</option>
        <option value="KW">KW</option>
        <option value="BH">BH</option>
        <option value="OM">OM</option>
      </select>

      <Label htmlFor="roleCategory">Role category</Label>
      <Input id="roleCategory" name="roleCategory" defaultValue="BC" required />

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

      <Button type="submit">{isPending ? "Saving…" : "Create requisition"}</Button>
      {state.errors?.form ? (
        <p className="text-sm text-red-700">{state.errors.form[0]}</p>
      ) : null}
    </form>
  );
}
