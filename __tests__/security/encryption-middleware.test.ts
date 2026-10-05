import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { encryptionQueryHook } from "@/core/db/encryption.middleware";
import { decrypt, blindIndex } from "@/core/security/crypto";
import { DecryptionError } from "@/lib/errors";

function loadEnvLocal() {
  try {
    const text = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of text.split("\n")) {
      const m = line.match(/^([A-Z_]+)=(.*)$/);
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2];
      }
    }
  } catch {
    // rely on process.env
  }
}

beforeAll(() => {
  loadEnvLocal();
});

describe("encryption middleware (in-memory query stub)", () => {
  it("create encrypts passport and sets bidx", async () => {
    let stored: Record<string, unknown> | null = null;
    const result = await encryptionQueryHook({
      model: "Candidate",
      operation: "create",
      args: {
        data: {
          fullName: "Test",
          passportNumber: "AB-123456",
          tenantId: "t1",
        },
      },
      query: async (args) => {
        stored = { ...(args.data as Record<string, unknown>), id: "c1" };
        return { ...stored };
      },
    });

    expect(stored).not.toBeNull();
    expect(stored!.passportNumber).not.toBe("AB-123456");
    expect(typeof stored!.passportNumber).toBe("string");
    expect(stored!.passportNumberBidx).toBe(blindIndex("AB-123456"));
    // returned row is decrypted
    expect((result as { passportNumber: string }).passportNumber).toBe(
      "AB-123456"
    );
  });

  it("read decrypts passport", async () => {
    let cipher = "";
    await encryptionQueryHook({
      model: "Candidate",
      operation: "create",
      args: { data: { passportNumber: "XY999", tenantId: "t1" } },
      query: async (args) => {
        cipher = (args.data as { passportNumber: string }).passportNumber;
        return { passportNumber: cipher };
      },
    });

    const row = await encryptionQueryHook({
      model: "Candidate",
      operation: "findFirst",
      args: { where: {} },
      query: async () => ({ passportNumber: cipher }),
    });

    expect((row as { passportNumber: string }).passportNumber).toBe("XY999");
  });

  it("update passport produces a new ciphertext", async () => {
    const ciphers: string[] = [];
    await encryptionQueryHook({
      model: "Candidate",
      operation: "create",
      args: { data: { passportNumber: "A1", tenantId: "t1" } },
      query: async (args) => {
        ciphers.push((args.data as { passportNumber: string }).passportNumber);
        return args.data;
      },
    });
    await encryptionQueryHook({
      model: "Candidate",
      operation: "update",
      args: { data: { passportNumber: "A1" }, where: { id: "c1" } },
      query: async (args) => {
        ciphers.push((args.data as { passportNumber: string }).passportNumber);
        return args.data;
      },
    });
    expect(ciphers[0]).not.toBe(ciphers[1]);
    expect(decrypt(ciphers[0])).toBe("A1");
    expect(decrypt(ciphers[1])).toBe("A1");
  });

  it("update passport to null clears bidx", async () => {
    let written: Record<string, unknown> | null = null;
    await encryptionQueryHook({
      model: "Candidate",
      operation: "update",
      args: {
        data: { passportNumber: null },
        where: { id: "c1" },
      },
      query: async (args) => {
        written = args.data as Record<string, unknown>;
        return written;
      },
    });
    expect(written!.passportNumber).toBeNull();
    expect(written!.passportNumberBidx).toBeNull();
  });

  it("filter where passportNumber uses bidx", async () => {
    let whereSeen: Record<string, unknown> | null = null;
    await encryptionQueryHook({
      model: "Candidate",
      operation: "findFirst",
      args: { where: { passportNumber: "AB-123456" } },
      query: async (args) => {
        whereSeen = args.where as Record<string, unknown>;
        return null;
      },
    });
    expect(whereSeen).not.toHaveProperty("passportNumber");
    expect(whereSeen!.passportNumberBidx).toBe(blindIndex("AB-123456"));
  });

  it("filter with normalized form matches same bidx", async () => {
    let whereSeen: Record<string, unknown> | null = null;
    await encryptionQueryHook({
      model: "Candidate",
      operation: "findMany",
      args: { where: { passportNumber: "ab 123456" } },
      query: async (args) => {
        whereSeen = args.where as Record<string, unknown>;
        return [];
      },
    });
    expect(whereSeen!.passportNumberBidx).toBe(blindIndex("AB-123456"));
  });

  it("decrypt failure on read throws DecryptionError", async () => {
    await expect(
      encryptionQueryHook({
        model: "Candidate",
        operation: "findFirst",
        args: { where: {} },
        query: async () => ({ passportNumber: "not-valid-ciphertext!!!!" }),
      })
    ).rejects.toBeInstanceOf(DecryptionError);
  });
});
