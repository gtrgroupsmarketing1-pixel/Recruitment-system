import type { StorageClient } from "./storage.types";
import { localDriver, verifyStorageSig } from "./local.driver";

export type { StorageClient } from "./storage.types";
export { verifyStorageSig };

let cached: StorageClient | null = null;

/**
 * Lazy driver. STORAGE_DRIVER=local (default, CI) uses the filesystem driver.
 * s3/r2 load the AWS client only on first use.
 */
/** Sole storage entry point. Do not reintroduce `export const storage`. */
export function getStorage(): StorageClient {
  if (cached) return cached;
  const driver = process.env.STORAGE_DRIVER ?? "local";
  if (driver === "s3" || driver === "r2") {
    // Lazy require so client bundles and CI never load the SDK unless configured.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("./s3.driver") as { s3Driver: StorageClient };
    cached = mod.s3Driver;
    return cached;
  }
  cached = localDriver;
  return cached;
}
