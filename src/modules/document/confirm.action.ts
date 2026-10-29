"use server";

import { revalidatePath } from "next/cache";
import { withSessionScope } from "@/core/auth/action-scope";
import { requirePermission } from "@/core/auth/session";
import { db } from "@/core/db/client";
import { NotFoundError } from "@/lib/errors";

export async function confirmDocumentAction(formData: FormData) {
  const documentId = String(formData.get("documentId") ?? "");
  if (!documentId) return;
  await withSessionScope(async (scope) => {
    requirePermission("document:upload");
    const row = await db.document.findFirst({
      where: { id: documentId, tenantId: scope.tenantId, deletedAt: null },
    });
    if (!row) throw new NotFoundError("Document", documentId);
    await db.document.updateMany({
      where: { id: documentId, tenantId: scope.tenantId },
      data: { confirmed: true },
    });
  });
  revalidatePath("/documents");
}
