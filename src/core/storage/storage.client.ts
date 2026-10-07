import { createHmac } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

export interface StorageClient {
  getSignedUploadUrl(key: string, mimeType: string, expiresIn: number): Promise<string>;
  getSignedDownloadUrl(key: string, expiresIn: number): Promise<string>;
  deleteObject(key: string): Promise<void>;
  headObject(key: string): Promise<{ size: number; contentType: string } | null>;
  writeObject(key: string, bytes: Buffer, contentType: string): Promise<void>;
}

const root = path.join(process.cwd(), ".storage");

function sign(key: string, exp: number): string {
  return createHmac("sha256", process.env.AUTH_SECRET ?? "dev-storage").update(`${key}.${exp}`).digest("hex");
}

export const storage: StorageClient = {
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
    await writeFile(file, "").catch(() => undefined);
  },
  async headObject(key) {
    try {
      const file = path.join(root, key);
      const info = await stat(file);
      const meta = await readFile(file + ".meta", "utf8").catch(() => "application/octet-stream");
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
};

export function verifyStorageSig(key: string, exp: number, sig: string): boolean {
  if (exp < Math.floor(Date.now() / 1000)) return false;
  return sign(key, exp) === sig;
}
