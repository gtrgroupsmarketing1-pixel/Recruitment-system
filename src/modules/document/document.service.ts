import { randomUUID } from "node:crypto";
import { db, authPrisma, runInTenantTx } from "@/core/db/client";
import { getStorage } from "@/core/storage/storage.client";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { eventBus } from "@/core/events/event-bus";
import { isMimeAllowed } from "./document.mime";
import { storageKeyFor } from "./document.sanitize";
import { daysRemaining } from "./document.expiry";
import { DocumentSyncService } from "./document.sync.service";
import type { DocumentType } from "@prisma/client";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export const DocumentService = {
  async requestUpload(
    tenantId: string,
    userId: string,
    input: {
      type: DocumentType;
      candidateId?: string | null;
      checklistId?: string | null;
      label: string;
      fileName: string;
      mimeType: string;
      sizeBytes: number;
      expiryDate?: Date | null;
    }
  ) {
    if (input.sizeBytes > MAX_UPLOAD_BYTES) throw new ValidationError("File too large");
    if (!isMimeAllowed(input.type, input.mimeType)) throw new ValidationError("MIME not allowed");
    const documentId = randomUUID().replace(/-/g, "").slice(0, 24);
    const storageKey = storageKeyFor({
      tenantId,
      documentId,
      fileName: input.fileName,
      candidateId: input.candidateId,
      checklistId: input.checklistId,
    });
    const uploadUrl = await getStorage().getSignedUploadUrl(storageKey, input.mimeType, 900);
    await db.document.create({
      data: {
        id: documentId,
        tenantId,
        candidateId: input.candidateId,
        checklistId: input.checklistId,
        type: input.type,
        label: input.label,
        fileName: input.fileName,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        storageKey,
        storageBucket: "local",
        expiryDate: input.expiryDate,
        uploadedBy: userId,
        confirmed: false,
      },
    });
    return { documentId, uploadUrl };
  },

  async confirmUpload(tenantId: string, _userId: string, documentId: string, checksumSha256: string) {
    const row = await db.document.findFirst({ where: { id: documentId, tenantId, deletedAt: null } });
    if (!row) throw new NotFoundError("Document", documentId);
    const head = await getStorage().headObject(row.storageKey);
    if (!head) throw new ValidationError("Upload not found");
    await runInTenantTx(tenantId, async () => {
      await db.document.updateMany({
        where: { id: documentId, tenantId },
        data: { confirmed: true, checksumSha256, sizeBytes: head.size },
      });
      await DocumentSyncService.enqueueSync(tenantId, documentId);
    });
    return db.document.findFirst({ where: { id: documentId, tenantId } });
  },

  async listForCandidate(tenantId: string, candidateId: string) {
    return db.document.findMany({
      where: { tenantId, candidateId, deletedAt: null, confirmed: true },
      orderBy: { createdAt: "desc" },
      include: {
        syncStates: {
          where: { status: "SYNCED" },
          select: { externalUrl: true, provider: true },
        },
      },
    });
  },

  async listForChecklist(tenantId: string, checklistId: string) {
    return db.document.findMany({
      where: { tenantId, checklistId, deletedAt: null, confirmed: true },
      orderBy: { createdAt: "desc" },
    });
  },

  async listRecent(tenantId: string, take = 50) {
    return db.document.findMany({
      where: { tenantId, deletedAt: null, confirmed: true },
      orderBy: { createdAt: "desc" },
      take,
      include: {
        syncStates: {
          where: { status: "SYNCED" },
          select: { externalUrl: true, provider: true },
        },
      },
    });
  },

  async listPendingConfirm(tenantId: string, take = 20) {
    return db.document.findMany({
      where: { tenantId, deletedAt: null, confirmed: false },
      orderBy: { createdAt: "desc" },
      take,
    });
  },

  async listExpiring(withinDays: number) {
    const until = new Date(Date.now() + withinDays * 86_400_000);
    return authPrisma.document.findMany({
      where: { deletedAt: null, confirmed: true, expiryDate: { lte: until } },
    });
  },

  async getDownloadUrl(tenantId: string, userId: string, documentId: string) {
    const row = await db.document.findFirst({ where: { id: documentId, tenantId, deletedAt: null, confirmed: true } });
    if (!row) throw new NotFoundError("Document", documentId);
    await db.auditLog.create({
      data: {
        tenantId,
        userId,
        entity: "Document",
        entityId: documentId,
        field: "download",
        oldValue: null,
        newValue: null,
      },
    });
    const url = await getStorage().getSignedDownloadUrl(row.storageKey, 900);
    return { url, expiresIn: 900 };
  },

  async setClientVisible(tenantId: string, documentId: string, clientVisible: boolean) {
    const row = await db.document.findFirst({ where: { id: documentId, tenantId, deletedAt: null } });
    if (!row) throw new NotFoundError("Document", documentId);
    await db.document.updateMany({ where: { id: documentId, tenantId }, data: { clientVisible } });
    return { id: documentId, clientVisible };
  },

  async softDelete(tenantId: string, _userId: string, documentId: string) {
    const row = await db.document.findFirst({ where: { id: documentId, tenantId, deletedAt: null } });
    if (!row) throw new NotFoundError("Document", documentId);
    await db.document.updateMany({ where: { id: documentId, tenantId }, data: { deletedAt: new Date() } });
  },

  async publishExpiring(withinDays: number) {
    const rows = await DocumentService.listExpiring(withinDays);
    for (const row of rows) {
      if (!row.expiryDate) continue;
      await eventBus.publish({
        type: "document.expiring",
        tenantId: row.tenantId,
        payload: {
          documentId: row.id,
          candidateId: row.candidateId,
          type: row.type,
          expiresOn: row.expiryDate.toISOString(),
          daysRemaining: daysRemaining(row.expiryDate, Date.now()),
        },
      });
    }
    return rows.length;
  },
};
