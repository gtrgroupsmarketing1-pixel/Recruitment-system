import { describe, it, expect } from "vitest";
import { authPrisma, withTenant } from "@/core/db/client";
import { DocumentService } from "@/modules/document/document.service";
import { getStorage } from "@/core/storage/storage.client";

const storage = getStorage();

const hasDb = Boolean(process.env.DATABASE_URL && process.env.AUTH_DATABASE_URL);

describe.skipIf(!hasDb)("document audit", () => {
  it("logs downloads and soft-deletes", async () => {
    const stamp = Date.now();
    const tenant = await authPrisma.tenant.create({ data: { id: `t-da-${stamp}`, name: "D", slug: `da-${stamp}` } });
    const user = await authPrisma.user.create({ data: { id: `u-da-${stamp}`, tenantId: tenant.id, email: `da-${stamp}@t.local`, name: "D", role: "RECRUITER" } });
    const requested = await withTenant(tenant.id, () =>
      DocumentService.requestUpload(tenant.id, user.id, {
        type: "PHOTO",
        label: "Photo",
        fileName: "photo.jpg",
        mimeType: "image/jpeg",
        sizeBytes: 8,
      })
    );
    const row = await authPrisma.document.findFirst({ where: { id: requested.documentId } });
    await storage.writeObject(row!.storageKey, Buffer.from("img"), "image/jpeg");
    await withTenant(tenant.id, () => DocumentService.confirmUpload(tenant.id, user.id, requested.documentId, "checksum1"));
    await withTenant(tenant.id, () => DocumentService.getDownloadUrl(tenant.id, user.id, requested.documentId));
    const logs = await authPrisma.auditLog.findMany({ where: { tenantId: tenant.id, entityId: requested.documentId } });
    expect(logs.some((l) => l.field === "download")).toBe(true);
    await withTenant(tenant.id, () => DocumentService.softDelete(tenant.id, user.id, requested.documentId));
    const deleted = await authPrisma.document.findFirst({ where: { id: requested.documentId } });
    expect(deleted?.deletedAt).toBeTruthy();
  });
});
