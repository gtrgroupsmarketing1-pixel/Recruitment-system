import { describe, it, expect } from "vitest";
import { authPrisma, withTenant } from "@/core/db/client";
import { DocumentService } from "@/modules/document/document.service";
import { getStorage } from "@/core/storage/storage.client";

const storage = getStorage();
import { NotFoundError } from "@/lib/errors";

const hasDb = Boolean(process.env.DATABASE_URL && process.env.AUTH_DATABASE_URL);

describe.skipIf(!hasDb)("document upload flow", () => {
  it("confirms only after the object exists and rejects other tenants", async () => {
    const stamp = Date.now();
    const tenant = await authPrisma.tenant.create({ data: { id: `t-doc-${stamp}`, name: "D", slug: `doc-${stamp}` } });
    const other = await authPrisma.tenant.create({ data: { id: `t-docb-${stamp}`, name: "B", slug: `docb-${stamp}` } });
    const user = await authPrisma.user.create({ data: { id: `u-doc-${stamp}`, tenantId: tenant.id, email: `doc-${stamp}@t.local`, name: "D", role: "RECRUITER" } });
    const requested = await withTenant(tenant.id, () =>
      DocumentService.requestUpload(tenant.id, user.id, {
        type: "PASSPORT",
        label: "Passport",
        fileName: "passport.jpg",
        mimeType: "image/jpeg",
        sizeBytes: 12,
      })
    );
    const row = await authPrisma.document.findFirst({ where: { id: requested.documentId } });
    expect(row?.confirmed).toBe(false);
    await storage.writeObject(row!.storageKey, Buffer.from("passport-bytes"), "image/jpeg");
    const confirmed = await withTenant(tenant.id, () =>
      DocumentService.confirmUpload(tenant.id, user.id, requested.documentId, "abc12345checksum")
    );
    expect(confirmed?.confirmed).toBe(true);
    await expect(
      withTenant(other.id, () => DocumentService.confirmUpload(other.id, user.id, requested.documentId, "abc12345checksum"))
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
