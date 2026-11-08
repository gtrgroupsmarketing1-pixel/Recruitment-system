"use server";

import { revalidatePath } from "next/cache";
import { withSessionScope } from "@/core/auth/action-scope";
import { requirePermission } from "@/core/auth/session";
import { db } from "@/core/db/client";
import { CandidateService } from "@/modules/candidate/candidate.service";
import { NotFoundError, ValidationError } from "@/lib/errors";

export async function convertLeadToCandidateAction(
  leadId: string,
  formData: FormData
) {
  const fullName = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const trade = String(formData.get("trade") ?? "").trim();
  const nationality = String(formData.get("nationality") ?? "").trim();

  if (!fullName) throw new ValidationError("Name is required");
  if (!phone) throw new ValidationError("Phone is required");

  const candidateId = await withSessionScope(async (scope) => {
    requirePermission("candidate:create");

    const lead = await db.whatsAppLead.findFirst({
      where: {
        id: leadId,
        tenantId: scope.tenantId,
        deletedAt: null,
      },
    });
    if (!lead) throw new NotFoundError("WhatsAppLead", leadId);
    if (lead.status === "CONVERTED" && lead.candidateId) {
      return lead.candidateId;
    }

    const candidate = await CandidateService.create(
      scope.tenantId,
      scope.userId,
      {
        fullName,
        phone,
      }
    );

    if (nationality) {
      await db.candidate.updateMany({
        where: { id: candidate.id, tenantId: scope.tenantId },
        data: { nationality },
      });
    }

    const noteParts = [
      lead.notes,
      trade ? `Trade: ${trade}` : null,
      lead.ctwaClid ? `ctwa_clid: ${lead.ctwaClid}` : null,
      lead.adId ? `adId: ${lead.adId}` : null,
    ].filter(Boolean);

    await db.whatsAppLead.updateMany({
      where: { id: leadId, tenantId: scope.tenantId },
      data: {
        status: "CONVERTED",
        candidateId: candidate.id,
        profileName: fullName,
        notes: noteParts.join("\n") || null,
      },
    });

    return candidate.id;
  });

  revalidatePath("/crm");
  revalidatePath("/candidates");
  revalidatePath(`/candidates/${candidateId}`);
  return { success: true as const, candidateId };
}

export async function markLeadContactedAction(leadId: string) {
  await withSessionScope(async (scope) => {
    requirePermission("candidate:view");
    await db.whatsAppLead.updateMany({
      where: {
        id: leadId,
        tenantId: scope.tenantId,
        status: "NEW",
        deletedAt: null,
      },
      data: { status: "CONTACTED" },
    });
  });
  revalidatePath("/crm");
}
