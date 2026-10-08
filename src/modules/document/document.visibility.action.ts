"use server";
import { revalidatePath } from "next/cache";
import { withSessionScope } from "@/core/auth/action-scope";
import { requirePermission } from "@/core/auth/permissions";
import { DocumentService } from "./document.service";

export async function setDocumentClientVisibleAction(formData: FormData) {
  const documentId = String(formData.get("documentId") ?? "");
  const candidateId = String(formData.get("candidateId") ?? "");
  const clientVisible = formData.get("clientVisible") === "on";
  await withSessionScope(async (scope) => {
    requirePermission("document:upload");
    await DocumentService.setClientVisible(scope.tenantId, documentId, clientVisible);
  });
  if (candidateId) revalidatePath(`/candidates/${candidateId}/documents`);
}
