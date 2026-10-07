import { describe, it, expect } from "vitest";
import { storage } from "@/core/storage/storage.client";

describe("local storage", () => {
  it("signs an upload url and reads head after write", async () => {
    const key = "tenants/t/candidates/c/d/file.jpg";
    const url = await storage.getSignedUploadUrl(key, "image/jpeg", 900);
    expect(url).toContain("/api/storage/local");
    await storage.writeObject(key, Buffer.from("abc"), "image/jpeg");
    const head = await storage.headObject(key);
    expect(head?.size).toBe(3);
  });
});
