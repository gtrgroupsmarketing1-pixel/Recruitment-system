import { describe, it, expect, afterEach } from "vitest";
import { authPrisma, db, withTenant } from "@/core/db/client";
import { DocumentSyncService } from "@/modules/document/document.sync.service";
import { setDriveClientFactory } from "@/core/drive/factory";
import { getStorage } from "@/core/storage/storage.client";
import { runDocumentSyncJob } from "@/core/jobs/jobs/document-sync.job";
import type { ExternalDriveClient } from "@/core/drive/drive.client";

const hasDb = Boolean(process.env.DATABASE_URL && process.env.AUTH_DATABASE_URL);

function fakeClient(fail = false): ExternalDriveClient {
  return {
    async ensureRootFolder(name) {
      return { id: "root", name };
    },
    async ensureFolder(_parentId, name) {
      return { id: `fld-${name}`, name };
    },
    async uploadFile(input) {
      if (fail) throw new Error("provider_down");
      return { id: `file-${input.name}`, url: `https://drive.example/${input.name}` };
    },
    async deleteFile() {},
  };
}

describe.skipIf(!hasDb)("document sync service", () => {
  afterEach(() => {
    setDriveClientFactory(null);
  });

  it("enqueueSync with no connection creates SKIPPED", async () => {
    const stamp = Date.now();
    const tenant = await authPrisma.tenant.create({
      data: { id: `t-sy-${stamp}`, name: "Sync", slug: `sy-${stamp}` },
    });
    const user = await authPrisma.user.create({
      data: { id: `u-sy-${stamp}`, tenantId: tenant.id, email: `sy-${stamp}@t.local`, name: "S", role: "TENANT_ADMIN" },
    });
    const doc = await authPrisma.document.create({
      data: {
        id: `d-sy-${stamp}`,
        tenantId: tenant.id,
        type: "OTHER",
        label: "Passport",
        fileName: "p.pdf",
        mimeType: "application/pdf",
        sizeBytes: 1,
        storageKey: `k-${stamp}`,
        storageBucket: "local",
        uploadedBy: user.id,
        confirmed: true,
      },
    });
    await withTenant(tenant.id, () => DocumentSyncService.enqueueSync(tenant.id, doc.id));
    const rows = await authPrisma.documentSyncState.findMany({ where: { documentId: doc.id } });
    expect(rows.length).toBe(2);
    expect(rows.every((r) => r.status === "SKIPPED")).toBe(true);
  });

  it("syncDocument with mocked provider marks SYNCED", async () => {
    const stamp = Date.now() + 3;
    const tenant = await authPrisma.tenant.create({
      data: { id: `t-sp-${stamp}`, name: "SyncP", slug: `sp-${stamp}` },
    });
    const user = await authPrisma.user.create({
      data: { id: `u-sp-${stamp}`, tenantId: tenant.id, email: `sp-${stamp}@t.local`, name: "S", role: "TENANT_ADMIN" },
    });
    const key = `docs/${stamp}/med.pdf`;
    await getStorage().writeObject(key, Buffer.from("pdf"), "application/pdf");
    const doc = await authPrisma.document.create({
      data: {
        id: `d-sp-${stamp}`,
        tenantId: tenant.id,
        type: "OTHER",
        label: "Wafid Medical",
        fileName: "med.pdf",
        mimeType: "application/pdf",
        sizeBytes: 3,
        storageKey: key,
        storageBucket: "local",
        uploadedBy: user.id,
        confirmed: true,
      },
    });
    await withTenant(tenant.id, async () => {
      await db.tenantStorageConnection.create({
        data: {
          id: `c-sp-${stamp}`,
          tenantId: tenant.id,
          provider: "GOOGLE_DRIVE",
          externalAccountId: "g1",
          externalEmail: "a@b.c",
          accessToken: "tok",
          refreshToken: "ref",
          tokenExpiresAt: new Date(Date.now() + 3600_000),
          rootFolderId: "root",
          rootFolderName: "SyncP",
          scopes: "drive.file",
          connectedBy: user.id,
        },
      });
      await DocumentSyncService.enqueueSync(tenant.id, doc.id);
    });
    setDriveClientFactory(() => fakeClient());
    await withTenant(tenant.id, () => DocumentSyncService.syncDocument(tenant.id, doc.id, "GOOGLE_DRIVE"));
    const row = await authPrisma.documentSyncState.findFirst({
      where: { documentId: doc.id, provider: "GOOGLE_DRIVE" },
    });
    expect(row?.status).toBe("SYNCED");
    expect(row?.externalFileId).toBe("file-med.pdf");
  });

  it("retry job picks FAILED rows and increments attempts", async () => {
    const stamp = Date.now() + 7;
    const tenant = await authPrisma.tenant.create({
      data: { id: `t-rj-${stamp}`, name: "Retry", slug: `rj-${stamp}` },
    });
    const user = await authPrisma.user.create({
      data: { id: `u-rj-${stamp}`, tenantId: tenant.id, email: `rj-${stamp}@t.local`, name: "S", role: "TENANT_ADMIN" },
    });
    const doc = await authPrisma.document.create({
      data: {
        id: `d-rj-${stamp}`,
        tenantId: tenant.id,
        type: "OTHER",
        label: "Visa",
        fileName: "v.pdf",
        mimeType: "application/pdf",
        sizeBytes: 1,
        storageKey: `missing-rj-${stamp}`,
        storageBucket: "local",
        uploadedBy: user.id,
        confirmed: true,
      },
    });
    await withTenant(tenant.id, () =>
      db.tenantStorageConnection.create({
        data: {
          id: `c-rj-${stamp}`,
          tenantId: tenant.id,
          provider: "ONEDRIVE",
          externalAccountId: "m1",
          externalEmail: "m@b.c",
          accessToken: "tok",
          refreshToken: "ref",
          tokenExpiresAt: new Date(Date.now() + 3600_000),
          rootFolderId: "root",
          rootFolderName: "Retry",
          scopes: "Files.ReadWrite.AppFolder",
          connectedBy: user.id,
        },
      })
    );
    await authPrisma.documentSyncState.create({
      data: {
        id: `ss-rj-${stamp}`,
        tenantId: tenant.id,
        documentId: doc.id,
        provider: "ONEDRIVE",
        status: "FAILED",
        attempts: 1,
        nextAttemptAt: new Date(Date.now() - 1000),
      },
    });
    setDriveClientFactory(() => fakeClient(true));
    await runDocumentSyncJob();
    const row = await authPrisma.documentSyncState.findFirst({ where: { id: `ss-rj-${stamp}` } });
    expect(row?.status).toBe("FAILED");
    expect(row?.attempts).toBe(2);
    expect(row?.lastError).toBeTruthy();
  });
});
