"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createCandidateAction,
  type CandidateFormState,
} from "@/modules/candidate/create.action";

type Props = { requisitionId?: string };

export function CandidateForm({ requisitionId }: Props) {
  const [state, formAction, isPending] = useActionState<
    CandidateFormState,
    FormData
  >(createCandidateAction, {});

  return (
    <form action={formAction} className="grid max-w-md gap-3">
      {requisitionId ? (
        <input type="hidden" name="requisitionId" value={requisitionId} />
      ) : null}
      <Label htmlFor="fullName">Full name</Label>
      <Input id="fullName" name="fullName" required autoComplete="name" />
      {state.errors?.fullName ? (
        <p className="text-sm text-red-700">{state.errors.fullName[0]}</p>
      ) : null}
      <Label htmlFor="phone">Phone</Label>
      <Input id="phone" name="phone" autoComplete="tel" />
      <Label htmlFor="email">Email</Label>
      <Input id="email" name="email" type="email" autoComplete="email" />
      <Label htmlFor="passportNumber">Passport number</Label>
      <Input id="passportNumber" name="passportNumber" />
      <Label htmlFor="nationalId">National ID</Label>
      <Input id="nationalId" name="nationalId" />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="smsOptIn" />
        <span>Candidate consents to SMS notifications</span>
      </label>
      <p className="text-xs text-muted-foreground">
        After create, open the candidate profile to upload CV and supporting
        documents. A short ID (C-XXXXXX) is assigned automatically.
      </p>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving…" : "Create candidate"}
      </Button>
      {state.errors?.form ? (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.errors.form[0]}
        </p>
      ) : null}
      {state.errors
        ? Object.entries(state.errors)
            .filter(([k]) => k !== "form" && k !== "fullName")
            .map(([k, msgs]) =>
              msgs?.map((m, i) => (
                <p key={`${k}-${i}`} className="text-sm text-red-700">
                  {k}: {m}
                </p>
              ))
            )
        : null}
    </form>
  );
}
