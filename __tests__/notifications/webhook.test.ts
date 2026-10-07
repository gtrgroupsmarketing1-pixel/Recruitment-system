import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  expectedBasicAuth,
  handlePostmarkWebhook,
} from "@/modules/notification/postmark.webhook";

const store = new Map<string, Record<string, unknown>>();

vi.mock("@/core/db/client", () => ({
  authPrisma: {
    notification: {
      findFirst: async ({ where }: { where: { providerId: string } }) =>
        store.get(where.providerId) ?? null,
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: Record<string, unknown>;
      }) => {
        for (const row of store.values()) {
          if (row.id === where.id) Object.assign(row, data);
        }
        return {};
      },
    },
  },
}));

describe("postmark webhook", () => {
  beforeEach(() => {
    store.clear();
    store.set("msg-1", {
      id: "n1",
      providerId: "msg-1",
      status: "SENT",
    });
  });

  const creds = { user: "hook", pass: "secret" };
  const auth = expectedBasicAuth("hook", "secret");

  it("wrong auth header → 401", async () => {
    const res = await handlePostmarkWebhook("Basic nope", { RecordType: "Delivery", MessageID: "msg-1" }, creds);
    expect(res.status).toBe(401);
  });

  it("unknown MessageID → 404", async () => {
    const res = await handlePostmarkWebhook(auth, { RecordType: "Delivery", MessageID: "missing" }, creds);
    expect(res.status).toBe(404);
  });

  it("Delivery updates status to DELIVERED", async () => {
    const res = await handlePostmarkWebhook(
      auth,
      { RecordType: "Delivery", MessageID: "msg-1", DeliveredAt: "2026-10-08T00:00:00Z" },
      creds
    );
    expect(res.status).toBe(200);
    expect(store.get("msg-1")?.status).toBe("DELIVERED");
    expect(store.get("msg-1")?.deliveredAt).toBeInstanceOf(Date);
  });

  it("Bounce sets type and reason", async () => {
    const res = await handlePostmarkWebhook(
      auth,
      {
        RecordType: "Bounce",
        MessageID: "msg-1",
        Type: "HardBounce",
        Description: "Mailbox does not exist",
      },
      creds
    );
    expect(res.status).toBe(200);
    expect(store.get("msg-1")?.status).toBe("BOUNCED");
    expect(store.get("msg-1")?.bounceType).toBe("HardBounce");
    expect(store.get("msg-1")?.bounceReason).toBe("Mailbox does not exist");
  });

  it("Open sets openedAt", async () => {
    const res = await handlePostmarkWebhook(
      auth,
      { RecordType: "Open", MessageID: "msg-1", ReceivedAt: "2026-10-08T01:00:00Z" },
      creds
    );
    expect(res.status).toBe(200);
    expect(store.get("msg-1")?.openedAt).toBeInstanceOf(Date);
  });

  it("duplicate Delivery is idempotent", async () => {
    await handlePostmarkWebhook(auth, { RecordType: "Delivery", MessageID: "msg-1" }, creds);
    const res = await handlePostmarkWebhook(auth, { RecordType: "Delivery", MessageID: "msg-1" }, creds);
    expect(res.status).toBe(200);
    expect(store.get("msg-1")?.status).toBe("DELIVERED");
  });
});
