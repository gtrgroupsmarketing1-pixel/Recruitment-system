import { randomUUID } from "node:crypto";
import type { DocumentType } from "@prisma/client";
import { authPrisma, runInTenantTx } from "@/core/db/client";
import { getStorage } from "@/core/storage/storage.client";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { eventBus } from "@/core/events/event-bus";
import { isMimeAllowed } from "@/modules/document/document.mime";
import { storageKeyFor } from "@/modules/document/document.sanitize";
import type { CandidateScope } from "@/core/candidate-auth/scope";

const ALLOWED: DocumentType[] = [
  "PASSPORT",
  "NATIONAL_ID",
  "PHOTO",
  "MEDICAL_CERTIFICATE",
  "ATTESTATION_PROOF",
  "OFFER_LETTER",
  "CONTRACT",
];
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export const CandidateDocumentService = {
  async list(scope: CandidateScope) {
    return authPrisma.document.findMany({
      where: { tenantId: scope.tenantId, candidateId: scope.candidateId, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
  },

  async requestUpload(scope: CandidateScope, input: {
    type: DocumentType;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
  }) {
    if (!ALLOWED.includes(input.type)) throw new ValidationError("Document type not allowed");
    if (input.sizeBytes > MAX_UPLOAD_BYTES) throw new ValidationError("File too large");
    if (!isMimeAllowed(input.type, input.mimeType)) throw new ValidationError("MIME not allowed");
    const documentId = randomUUID().replace(/-/g, "").slice(0, 24);
    const storageKey = storageKeyFor({
      tenantId: scope.tenantId,
      documentId,
      fileName: input.fileName,
      candidateId: scope.candidateId,
    });
    const uploadUrl = await getStorage().getSignedUploadUrl(storageKey, input.mimeType, 900);
    await authPrisma.document.create({
      data: {
        id: documentId,
        tenantId: scope.tenantId,
        candidateId: scope.candidateId,
        type: input.type,
        label: input.type,
        fileName: input.fileName,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        storageKey,
        storageBucket: "local",
        uploadedBy: null,
        confirmed: false,
      },
    });
    return { documentId, uploadUrl };
  },

  async confirmUpload(scope: CandidateScope, documentId: string, checksum: string) {
    const row = await authPrisma.document.findFirst({
      where: { id: documentId, tenantId: scope.tenantId, candidateId: scope.candidateId, deletedAt: null },
    });
    if (!row) throw new NotFoundError("Document", documentId);
    await authPrisma.document.updateMany({
      where: { id: documentId, tenantId: scope.tenantId, candidateId: scope.candidateId },
      data: { confirmed: true, checksumSha256: checksum },
    });
    await runInTenantTx(scope.tenantId, () => eventBus.publish({
      type: "document.uploaded",
      tenantId: scope.tenantId,
      payload: { documentId, candidateId: scope.candidateId, type: row.type },
    }));
  },

  async deleteOwn(scope: CandidateScope, documentId: string) {
    const row = await authPrisma.document.findFirst({
      where: { id: documentId, tenantId: scope.tenantId, candidateId: scope.candidateId, deletedAt: null },
    });
    if (!row) throw new NotFoundError("Document", documentId);
    await authPrisma.document.updateMany({
      where: { id: documentId, tenantId: scope.tenantId, candidateId: scope.candidateId },
      data: { deletedAt: new Date() },
    });
  },
};
