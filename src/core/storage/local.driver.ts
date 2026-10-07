import { createHmac } from "node:crypto";
import { mkdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type { StorageClient } from "./storage.types";

const root = path.join(process.cwd(), ".storage");

function sign(key: string, exp: number): string {
  return createHmac("sha256", process.env.AUTH_SECRET ?? "dev-storage")
    .update(`${key}.${exp}`)
    .digest("hex");
}

export const localDriver: StorageClient = {
  async getSignedUploadUrl(key, mimeType, expiresIn) {
    const exp = Math.floor(Date.now() / 1000) + expiresIn;
    return `/api/storage/local?op=put&key=${encodeURIComponent(key)}&mime=${encodeURIComponent(mimeType)}&exp=${exp}&sig=${sign(key, exp)}`;
  },
  async getSignedDownloadUrl(key, expiresIn) {
    const exp = Math.floor(Date.now() / 1000) + expiresIn;
    return `/api/storage/local?op=get&key=${encodeURIComponent(key)}&exp=${exp}&sig=${sign(key, exp)}`;
  },
  async deleteObject(key) {
    const file = path.join(root, key);
    await unlink(file).catch(() => undefined);
    await unlink(file + ".meta").catch(() => undefined);
  },
  async headObject(key) {
    try {
      const file = path.join(root, key);
      const info = await stat(file);
      const meta = await readFile(file + ".meta", "utf8").catch(
        () => "application/octet-stream"
      );
      return { size: info.size, contentType: meta };
    } catch {
      return null;
    }
  },
  async writeObject(key, bytes, contentType) {
    const file = path.join(root, key);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, bytes);
    await writeFile(file + ".meta", contentType);
  },
  async headBucket() {
    return { ok: true, latencyMs: 0 };
  },
};

export function verifyStorageSig(key: string, exp: number, sig: string): boolean {
  if (exp < Math.floor(Date.now() / 1000)) return false;
  return sign(key, exp) === sig;
}
