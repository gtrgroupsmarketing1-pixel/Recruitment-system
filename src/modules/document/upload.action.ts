"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { withSessionScope } from "@/core/auth/action-scope";
import { requirePermission } from "@/core/auth/session";
import { db } from "@/core/db/client";
import { getStorage } from "@/core/storage/storage.client";
import { ValidationError } from "@/lib/errors";
import type { DocumentType } from "@prisma/client";
import { storageKeyFor } from "./document.sanitize";
import { isMimeAllowed } from "./document.mime";

const MAX_BYTES = 10 * 1024 * 1024;

const ALLOWED_TYPES = new Set<string>([
  "PASSPORT",
  "NATIONAL_ID",
  "PHOTO",
  "MEDICAL_CERTIFICATE",
  "VISA",
  "ATTESTATION_PROOF",
  "LABOR_CLEARANCE",
  "TICKET",
  "BOARDING_PASS",
  "OFFER_LETTER",
  "CONTRACT",
  "OTHER",
]);

export type UploadDocState = { error?: string; success?: boolean };

export async function uploadCandidateDocumentAction(
  _prev: UploadDocState,
  formData: FormData
): Promise<UploadDocState> {
  try {
    const candidateId = String(formData.get("candidateId") ?? "").trim();
    const typeRaw = String(formData.get("type") ?? "OTHER").trim().toUpperCase();
    const labelRaw = String(formData.get("label") ?? "").trim();
    const file = formData.get("file");

    if (!candidateId) return { error: "Candidate is required" };
    if (!(file instanceof File) || file.size === 0) {
      return { error: "Choose a file to upload" };
    }
    if (file.size > MAX_BYTES) return { error: "File exceeds 10MB" };

    const type = (ALLOWED_TYPES.has(typeRaw) ? typeRaw : "OTHER") as DocumentType;
    const mimeType = file.type || "application/octet-stream";
    if (!isMimeAllowed(type, mimeType)) {
      return { error: "File type not allowed for this document category" };
    }

    const label =
      labelRaw ||
      (type === "OTHER" ? file.name : type.replace(/_/g, " "));

    await withSessionScope(async (scope) => {
      requirePermission("document:upload");
      const candidate = await db.candidate.findFirst({
        where: {
          id: candidateId,
          tenantId: scope.tenantId,
          deletedAt: null,
        },
        select: { id: true },
      });
      if (!candidate) throw new ValidationError("Candidate not found");

      const documentId = randomUUID().replace(/-/g, "").slice(0, 24);
      const fileName = (file.name || "document").replace(/[^\w.\-]+/g, "_");
      const storageKey = storageKeyFor({
        tenantId: scope.tenantId,
        documentId,
        fileName,
        candidateId,
      });
      const buf = Buffer.from(await file.arrayBuffer());
      await getStorage().writeObject(storageKey, buf, mimeType);

      await db.document.create({
        data: {
          id: documentId,
          tenantId: scope.tenantId,
          candidateId,
          type,
          label,
          fileName,
          mimeType,
          sizeBytes: buf.length,
          storageKey,
          storageBucket: "local",
          uploadedBy: scope.userId,
          confirmed: true,
        },
      });
    });

    revalidatePath("/documents");
    revalidatePath(`/candidates/${candidateId}/documents`);
    revalidatePath(`/candidates/${candidateId}`);
    return { success: true };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Upload failed",
    };
  }
}
