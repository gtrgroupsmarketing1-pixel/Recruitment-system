import { describe, it, expect, vi, beforeEach } from "vitest";

const docs = new Map<string, { id: string; confirmed: boolean; deletedAt: Date | null; createdAt: Date; storageKey: string; sizeBytes: number }>();
const deletedKeys: string[] = [];

vi.mock("@/core/db/client", () => ({
  authPrisma: {
    document: {
      findMany: async ({ where }: { where: { createdAt: { lt: Date }; confirmed: boolean } }) =>
        [...docs.values()].filter(
          (d) =>
            d.confirmed === where.confirmed &&
            d.deletedAt === null &&
            d.createdAt < where.createdAt.lt
        ),
      update: async ({ where, data }: { where: { id: string }; data: { deletedAt: Date } }) => {
        const row = docs.get(where.id);
        if (row) row.deletedAt = data.deletedAt;
        return row;
      },
    },
  },
}));

vi.mock("@/core/storage/storage.client", () => ({
  getStorage: () => ({
    headObject: async (key: string) => (key.startsWith("missing") ? null : { size: 10, contentType: "text/plain" }),
    deleteObject: async (key: string) => {
      deletedKeys.push(key);
    },
  }),
}));

describe("document gc", () => {
  beforeEach(() => {
    docs.clear();
    deletedKeys.length = 0;
  });

  it("unconfirmed older than 72h is soft-deleted and storage removed", async () => {
    docs.set("old", {
      id: "old",
      confirmed: false,
      deletedAt: null,
      createdAt: new Date(Date.now() - 80 * 3600_000),
      storageKey: "tenants/t/old.pdf",
      sizeBytes: 10,
    });
    const { sweepUnconfirmedDocuments } = await import("@/core/jobs/jobs/document-gc.job");
    const result = await sweepUnconfirmedDocuments();
    expect(result.processed).toBe(1);
    expect(deletedKeys).toContain("tenants/t/old.pdf");
    expect(docs.get("old")?.deletedAt).toBeInstanceOf(Date);
  });

  it("unconfirmed younger than 72h is untouched", async () => {
    docs.set("new", {
      id: "new",
      confirmed: false,
      deletedAt: null,
      createdAt: new Date(),
      storageKey: "tenants/t/new.pdf",
      sizeBytes: 4,
    });
    const { sweepUnconfirmedDocuments } = await import("@/core/jobs/jobs/document-gc.job");
    const result = await sweepUnconfirmedDocuments();
    expect(result.processed).toBe(0);
    expect(docs.get("new")?.deletedAt).toBeNull();
  });

  it("confirmed older than 72h is untouched", async () => {
    docs.set("ok", {
      id: "ok",
      confirmed: true,
      deletedAt: null,
      createdAt: new Date(Date.now() - 80 * 3600_000),
      storageKey: "tenants/t/ok.pdf",
      sizeBytes: 4,
    });
    const { sweepUnconfirmedDocuments } = await import("@/core/jobs/jobs/document-gc.job");
    const result = await sweepUnconfirmedDocuments();
    expect(result.processed).toBe(0);
  });
});
