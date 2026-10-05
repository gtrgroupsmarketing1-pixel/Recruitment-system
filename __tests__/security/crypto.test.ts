import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  encrypt,
  decrypt,
  blindIndex,
  encryptWithKey,
  decryptWithKey,
} from "@/core/security/crypto";
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

describe("crypto", () => {
  it("encrypt → decrypt round-trips", () => {
    const plain = "AB-123456";
    const cipher = encrypt(plain);
    expect(decrypt(cipher)).toBe(plain);
  });

  it("encrypt(A) twice produces different ciphertexts", () => {
    const a = encrypt("same");
    const b = encrypt("same");
    expect(a).not.toBe(b);
  });

  it("encrypt produces base64 with length divisible by 4", () => {
    const cipher = encrypt("hello");
    expect(cipher.length % 4).toBe(0);
    expect(() => Buffer.from(cipher, "base64")).not.toThrow();
  });

  it("decrypt of tampered ciphertext throws DecryptionError", () => {
    const cipher = encrypt("secret");
    const buf = Buffer.from(cipher, "base64");
    buf[buf.length - 1] ^= 0xff;
    const tampered = buf.toString("base64");
    expect(() => decrypt(tampered)).toThrow(DecryptionError);
  });

  it("decrypt of truncated ciphertext throws DecryptionError", () => {
    expect(() => decrypt("AAAA")).toThrow(DecryptionError);
  });

  it("blindIndex normalizes punctuation and case", () => {
    expect(blindIndex("AB-123456")).toBe(blindIndex("ab123456"));
    expect(blindIndex("AB-123456")).toBe(blindIndex("AB 123456"));
  });

  it("blindIndex differs for different values", () => {
    expect(blindIndex("A")).not.toBe(blindIndex("B"));
  });

  it("blindIndex is stable across calls", () => {
    expect(blindIndex("stable")).toBe(blindIndex("stable"));
  });

  it("encryptWithKey / decryptWithKey round-trip", () => {
    const key = Buffer.from(process.env.ENCRYPTION_KEY!, "base64");
    const c = encryptWithKey("x", key);
    expect(decryptWithKey(c, key)).toBe("x");
  });
});
