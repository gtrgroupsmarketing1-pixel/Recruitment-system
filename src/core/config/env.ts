import { z } from "zod";
import { ValidationError } from "@/lib/errors";

const base64Key32 = z
  .string()
  .min(1)
  .refine((v) => {
    try {
      return Buffer.from(v, "base64").length === 32;
    } catch {
      return false;
    }
  }, "Key must be base64-encoded 32 bytes");

const envSchema = z.object({
  ENCRYPTION_KEY: base64Key32,
  BLIND_INDEX_KEY: base64Key32,
  ENCRYPTION_KEY_PREVIOUS: z
    .string()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined))
    .refine(
      (v) => {
        if (v === undefined) return true;
        try {
          return Buffer.from(v, "base64").length === 32;
        } catch {
          return false;
        }
      },
      "ENCRYPTION_KEY_PREVIOUS must be base64-encoded 32 bytes when set"
    ),
  DATABASE_URL: z.string().min(1),
  AUTH_DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1).optional(),
});

export type AppEnv = z.infer<typeof envSchema>;

/** Encryption keys only — used by crypto module at load time. */
export function parseEncryptionEnv(
  source: Record<string, string | undefined> = process.env
) {
  const result = envSchema
    .pick({
      ENCRYPTION_KEY: true,
      BLIND_INDEX_KEY: true,
      ENCRYPTION_KEY_PREVIOUS: true,
    })
    .safeParse({
      ENCRYPTION_KEY: source.ENCRYPTION_KEY,
      BLIND_INDEX_KEY: source.BLIND_INDEX_KEY,
      ENCRYPTION_KEY_PREVIOUS: source.ENCRYPTION_KEY_PREVIOUS,
    });
  if (!result.success) {
    throw new ValidationError(
      `Invalid encryption env: ${result.error.issues.map((i) => i.message).join("; ")}`
    );
  }
  return result.data;
}

/** Full app env including DB URLs. */
export function parseEnv(
  source: Record<string, string | undefined> = process.env
): AppEnv {
  const result = envSchema.safeParse({
    ENCRYPTION_KEY: source.ENCRYPTION_KEY,
    BLIND_INDEX_KEY: source.BLIND_INDEX_KEY,
    ENCRYPTION_KEY_PREVIOUS: source.ENCRYPTION_KEY_PREVIOUS,
    DATABASE_URL: source.DATABASE_URL,
    AUTH_DATABASE_URL: source.AUTH_DATABASE_URL,
    DIRECT_URL: source.DIRECT_URL,
  });
  if (!result.success) {
    throw new ValidationError(
      `Invalid env: ${result.error.issues.map((i) => i.message).join("; ")}`
    );
  }
  return result.data;
}
