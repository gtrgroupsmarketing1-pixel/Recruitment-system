"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { withSessionScope } from "@/core/auth/action-scope";
import { requirePermission } from "@/core/auth/permissions";
import { DocumentService } from "./document.service";

const VisibilitySchema = z.object({
  documentId: z.string().min(1),
  candidateId: z.string().min(1),
  clientVisible: z.boolean(),
});

export async function setDocumentClientVisibleAction(formData: FormData) {
  const parsed = VisibilitySchema.safeParse({
    documentId: formData.get("documentId"),
    candidateId: formData.get("candidateId"),
    clientVisible: formData.get("clientVisible") === "on",
  });
  if (!parsed.success) return;
  const { documentId, candidateId, clientVisible } = parsed.data;
  await withSessionScope(async (scope) => {
    requirePermission("document:upload");
    await DocumentService.setClientVisible(scope.tenantId, documentId, clientVisible);
  });
  if (candidateId) revalidatePath(`/candidates/${candidateId}/documents`);
}
