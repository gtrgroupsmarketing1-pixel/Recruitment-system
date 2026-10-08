import { describe, it, expect, vi, beforeEach } from "vitest";

const findFirst = vi.fn();
vi.mock("@/core/db/client", () => ({
  db: {
    candidate: { findFirst },
    user: { findFirst },
  },
}));

import { resolveChannel } from "@/core/notifications/channel-resolver";

describe("resolveChannel", () => {
  beforeEach(() => {
    findFirst.mockReset();
  });

  it("phone + whatsappOptIn → WHATSAPP", async () => {
    findFirst.mockResolvedValueOnce({
      phone: "+1",
      email: "a@b.c",
      smsOptIn: true,
      whatsappOptIn: true,
    });
    const r = await resolveChannel("t1", { candidateId: "c1" });
    expect(r?.channel).toBe("WHATSAPP");
  });

  it("phone + smsOptIn + no whatsapp → SMS", async () => {
    findFirst.mockResolvedValueOnce({
      phone: "+1",
      email: "a@b.c",
      smsOptIn: true,
      whatsappOptIn: false,
    });
    const r = await resolveChannel("t1", { candidateId: "c1" });
    expect(r?.channel).toBe("SMS");
  });

  it("email only → EMAIL", async () => {
    findFirst.mockResolvedValueOnce({
      phone: null,
      email: "a@b.c",
      smsOptIn: false,
      whatsappOptIn: false,
    });
    const r = await resolveChannel("t1", { candidateId: "c1" });
    expect(r?.channel).toBe("EMAIL");
  });

  it("no contact → null", async () => {
    findFirst.mockResolvedValueOnce({
      phone: null,
      email: null,
      smsOptIn: false,
      whatsappOptIn: false,
    });
    const r = await resolveChannel("t1", { candidateId: "c1" });
    expect(r).toBeNull();
  });

  it("user recipient → EMAIL", async () => {
    findFirst.mockResolvedValueOnce({ email: "u@t.com" });
    const r = await resolveChannel("t1", { userId: "u1" });
    expect(r?.channel).toBe("EMAIL");
    expect(r?.address).toBe("u@t.com");
  });
});
