import type { ExternalProvider } from "@prisma/client";
import { db } from "@/core/db/client";
import { driveClientFor } from "@/core/drive/factory";
import { folderPath, nextAttemptAt } from "@/core/drive/folder-path";
import { googleRefresh } from "@/core/drive/google.client";
import { microsoftRefresh } from "@/core/drive/microsoft.client";
import { ensureFreshToken } from "@/core/drive/token";
import { getStorage } from "@/core/storage/storage.client";

const PROVIDERS: ExternalProvider[] = ["GOOGLE_DRIVE", "ONEDRIVE"];

export const DocumentSyncService = {
  async enqueueSync(tenantId: string, documentId: string): Promise<void> {
    const connections = await db.tenantStorageConnection.findMany({
      where: { tenantId, deletedAt: null },
    });
    if (connections.length === 0) {
      for (const provider of PROVIDERS) {
        await db.documentSyncState.upsert({
          where: { documentId_provider: { documentId, provider } },
          create: { tenantId, documentId, provider, status: "SKIPPED" },
          update: { status: "SKIPPED", lastError: null },
        });
      }
      return;
    }
    for (const conn of connections) {
      await db.documentSyncState.upsert({
        where: { documentId_provider: { documentId, provider: conn.provider } },
        create: {
          tenantId,
          documentId,
          provider: conn.provider,
          status: "PENDING",
          nextAttemptAt: new Date(),
          attempts: 0,
        },
        update: { status: "PENDING", nextAttemptAt: new Date(), lastError: null },
      });
    }
  },

  async markSkipped(tenantId: string, documentId: string, provider: ExternalProvider) {
    await db.documentSyncState.upsert({
      where: { documentId_provider: { documentId, provider } },
      create: { tenantId, documentId, provider, status: "SKIPPED" },
      update: { status: "SKIPPED" },
    });
  },

  async syncDocument(tenantId: string, documentId: string, provider: ExternalProvider): Promise<void> {
    const doc = await db.document.findFirst({
      where: { id: documentId, tenantId, deletedAt: null },
      include: { candidate: { select: { fullName: true } } },
    });
    if (!doc) throw new Error("document_missing");
    const conn = await db.tenantStorageConnection.findFirst({
      where: { tenantId, provider, deletedAt: null },
    });
    if (!conn) {
      await DocumentSyncService.markSkipped(tenantId, documentId, provider);
      return;
    }
    const bytes = await getStorage().getObject(doc.storageKey);
    if (!bytes) throw new Error("object_missing");

    const fresh = await ensureFreshToken({
      accessToken: conn.accessToken,
      tokenExpiresAt: conn.tokenExpiresAt,
      refresh: async () => {
        const refreshed =
          provider === "GOOGLE_DRIVE"
            ? await googleRefresh(conn.refreshToken)
            : await microsoftRefresh(conn.refreshToken);
        return { access_token: refreshed.access_token, expires_in: refreshed.expires_in };
      },
    });
    if (fresh.refreshed) {
      await db.tenantStorageConnection.updateMany({
        where: { id: conn.id, tenantId },
        data: { accessToken: fresh.accessToken, tokenExpiresAt: fresh.tokenExpiresAt },
      });
    }

    const client = driveClientFor(provider, fresh.accessToken);
    const parts = folderPath({
      candidateName: doc.candidate?.fullName ?? "Candidate",
      candidateId: doc.candidateId ?? "none",
      stepName: doc.label,
      stepOrder: 1,
    });
    let parentId = conn.rootFolderId;
    for (const segment of parts) {
      const folder = await client.ensureFolder(parentId, segment);
      parentId = folder.id;
    }
    const uploaded = await client.uploadFile({
      parentId,
      name: doc.fileName,
      mimeType: doc.mimeType,
      content: bytes,
    });
    await db.documentSyncState.updateMany({
      where: { documentId, tenantId, provider },
      data: {
        status: "SYNCED",
        externalFileId: uploaded.id,
        externalUrl: uploaded.url,
        lastError: null,
      },
    });
    await db.tenantStorageConnection.updateMany({
      where: { id: conn.id, tenantId },
      data: { lastSyncAt: new Date(), lastError: null },
    });
  },

  async getSyncState(tenantId: string, documentId: string) {
    return db.documentSyncState.findMany({ where: { tenantId, documentId } });
  },

  async listFailedSyncs(tenantId: string, limit: number) {
    return db.documentSyncState.findMany({
      where: { tenantId, status: "FAILED" },
      take: limit,
      orderBy: { updatedAt: "desc" },
    });
  },

  async scheduleRetry(attempts: number, now = Date.now()): Promise<Date | null> {
    return nextAttemptAt(attempts, now);
  },
};
