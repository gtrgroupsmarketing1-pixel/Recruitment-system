"use server";

import { redirect } from "next/navigation";
import { requireSession } from "@/core/auth/session";
import { withTenant } from "@/core/db/client";
import { ApplicationService } from "@/modules/application/application.service";
import { CandidateService } from "./candidate.service";
import { CreateCandidateInput } from "./candidate.schema";

export type CandidateFormState = { errors?: Record<string, string[]> };

export async function createCandidateAction(
  _prev: CandidateFormState,
  formData: FormData
): Promise<CandidateFormState> {
  const session = await requireSession();
  const tenantId = session.user.tenantId || session.tenantId;
  if (!tenantId || !session.user.id) {
    return { errors: { form: ["Missing session tenant"] } };
  }
  const raw = Object.fromEntries(formData.entries());
  const payload: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "string" && value.trim() !== "") {
      payload[key] = value.trim();
    }
  }
  // Checkbox: present when checked ("on"), absent when unchecked
  payload.smsOptIn = formData.get("smsOptIn") === "on";
  const parsed = CreateCandidateInput.safeParse(payload);
  if (!parsed.success) {
    const errors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] ? String(issue.path[0]) : "form";
      errors[key] = [...(errors[key] ?? []), issue.message];
    }
    return { errors };
  }
  const created = await withTenant(tenantId, () =>
    CandidateService.create(tenantId, session.user.id, parsed.data)
  );
  const requisitionId = parsed.data.requisitionId;
  if (requisitionId) {
    await withTenant(tenantId, () =>
      ApplicationService.create(tenantId, session.user.id, {
        candidateId: created.id,
        requisitionId,
      })
    );
  }
  redirect(`/candidates/${created.id}`);
}
