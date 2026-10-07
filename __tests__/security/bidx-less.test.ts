import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { encryptionQueryHook } from "@/core/db/encryption.middleware";
import { decrypt } from "@/core/security/crypto";

function loadEnvLocal() {
  try {
    const text = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of text.split("\n")) {
      const m = line.match(/^([A-Z_]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  } catch {
    // rely on process.env
  }
}

beforeAll(() => {
  loadEnvLocal();
  process.env.ENCRYPTION_KEY ??= "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";
  process.env.BLIND_INDEX_KEY ??= "BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=";
});

describe("bidx-less sensitive fields", () => {
  it("encrypts and decrypts access tokens without a blind index", async () => {
    let stored: Record<string, unknown> | null = null;
    const result = await encryptionQueryHook({
      model: "TenantStorageConnection",
      operation: "create",
      args: { data: { accessToken: "ya29.secret", refreshToken: "1//refresh", tenantId: "t1" } },
      query: async (args) => {
        stored = { ...(args.data as Record<string, unknown>) };
        return { ...stored };
      },
    });
    expect(stored!.accessToken).not.toBe("ya29.secret");
    expect(stored).not.toHaveProperty("accessTokenBidx");
    expect(decrypt(String(stored!.accessToken))).toBe("ya29.secret");
    expect((result as { refreshToken: string }).refreshToken).toBe("1//refresh");
  });
});
