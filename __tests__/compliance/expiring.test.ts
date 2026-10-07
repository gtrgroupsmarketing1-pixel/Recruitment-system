import { describe, it, expect } from "vitest";
import { expiryBucket } from "@/modules/compliance/compliance.expiring";

describe("expiry buckets", () => {
  const today = new Date("2026-06-10T00:00:00.000Z");
  it("assigns inclusive boundaries", () => {
    expect(expiryBucket(new Date("2026-06-01T00:00:00.000Z"), today)).toBe("expired");
    expect(expiryBucket(new Date("2026-06-13T00:00:00.000Z"), today)).toBe("within7");
    expect(expiryBucket(new Date("2026-06-17T00:00:00.000Z"), today)).toBe("within7");
    expect(expiryBucket(new Date("2026-06-20T00:00:00.000Z"), today)).toBe("within15");
    expect(expiryBucket(new Date("2026-07-05T00:00:00.000Z"), today)).toBe("within30");
  });
});
