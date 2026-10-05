import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
} from "node:crypto";
import { parseEncryptionEnv } from "@/core/config/env";
import { DecryptionError } from "@/lib/errors";

const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const ALGORITHM = "aes-256-gcm";

function loadKeys() {
  const env = parseEncryptionEnv();
  const current = Buffer.from(env.ENCRYPTION_KEY, "base64");
  const previous = env.ENCRYPTION_KEY_PREVIOUS
    ? Buffer.from(env.ENCRYPTION_KEY_PREVIOUS, "base64")
    : null;
  const blind = Buffer.from(env.BLIND_INDEX_KEY, "base64");
  if (current.length !== 32 || blind.length !== 32) {
    throw new DecryptionError("Encryption keys must decode to 32 bytes");
  }
  if (previous && previous.length !== 32) {
    throw new DecryptionError("ENCRYPTION_KEY_PREVIOUS must decode to 32 bytes");
  }
  return { current, previous, blind };
}

let cached: ReturnType<typeof loadKeys> | null = null;

function keys() {
  if (!cached) {
    cached = loadKeys();
  }
  return cached;
}

/** Internal: encrypt with an explicit key. Format: base64(IV || ciphertext || authTag). */
export function encryptWithKey(plaintext: string, key: Buffer): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, encrypted, authTag]).toString("base64");
}

/** Internal: decrypt with an explicit key. */
export function decryptWithKey(ciphertext: string, key: Buffer): string {
  let buf: Buffer;
  try {
    buf = Buffer.from(ciphertext, "base64");
  } catch {
    throw new DecryptionError("Invalid ciphertext encoding");
  }
  if (buf.length < IV_LENGTH + AUTH_TAG_LENGTH + 1) {
    throw new DecryptionError("Ciphertext too short");
  }
  const iv = buf.subarray(0, IV_LENGTH);
  const authTag = buf.subarray(buf.length - AUTH_TAG_LENGTH);
  const data = buf.subarray(IV_LENGTH, buf.length - AUTH_TAG_LENGTH);
  try {
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
    return decrypted.toString("utf8");
  } catch {
    throw new DecryptionError("Auth tag mismatch or bad ciphertext");
  }
}

export function encrypt(plaintext: string): string {
  return encryptWithKey(plaintext, keys().current);
}

/**
 * Decrypts with current key, then ENCRYPTION_KEY_PREVIOUS if set.
 * Never returns null — throws DecryptionError.
 */
export function decrypt(ciphertext: string): string {
  const { current, previous } = keys();
  try {
    return decryptWithKey(ciphertext, current);
  } catch {
    if (previous) {
      return decryptWithKey(ciphertext, previous);
    }
    throw new DecryptionError("Auth tag mismatch or bad ciphertext");
  }
}

function normalizeForBlindIndex(value: string): string {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/** HMAC-SHA256 hex over normalized plaintext. */
export function blindIndex(plaintext: string): string {
  const normalized = normalizeForBlindIndex(plaintext);
  return createHmac("sha256", keys().blind)
    .update(normalized, "utf8")
    .digest("hex");
}
