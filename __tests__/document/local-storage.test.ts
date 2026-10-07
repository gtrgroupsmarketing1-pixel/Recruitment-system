import { describe, it, expect } from "vitest";
import { getStorage, verifyStorageSig } from "@/core/storage/storage.client";

const storage = getStorage();

describe("local storage", () => {
  it("signs an upload url and reads head after write", async () => {
    const key = "tenants/t/candidates/c/d/file.jpg";
    const url = await storage.getSignedUploadUrl(key, "image/jpeg", 900);
    expect(url).toContain("/api/storage/local");
    await storage.writeObject(key, Buffer.from("abc"), "image/jpeg");
    const head = await storage.headObject(key);
    expect(head?.size).toBe(3);
  });

  it("rejects an expired signature", () => {
    const exp = Math.floor(Date.now() / 1000) - 2;
    expect(verifyStorageSig("tenants/t/x", exp, "not-a-real-sig")).toBe(false);
  });

  it("accepts a signature that has not expired", async () => {
    const url = await storage.getSignedUploadUrl("tenants/t/x", "image/jpeg", 60);
    const parsed = new URL(url, "http://local");
    const key = parsed.searchParams.get("key") ?? "";
    const exp = Number(parsed.searchParams.get("exp"));
    const sig = parsed.searchParams.get("sig") ?? "";
    expect(exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
    expect(verifyStorageSig(key, exp, sig)).toBe(true);
  });
});
