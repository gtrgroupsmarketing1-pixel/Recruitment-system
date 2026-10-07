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

/** Object schema — supports .pick() for encryption-only parse. */
const envObjectSchema = z.object({
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
  EMAIL_DRIVER: z.enum(["postmark", "log"]).default("log"),
  POSTMARK_TOKEN: z.string().optional(),
  WHATSAPP_DRIVER: z.enum(["meta", "log"]).default("log"),
  META_WHATSAPP_TOKEN: z.string().optional(),
  META_WHATSAPP_PHONE_ID: z.string().optional(),
  CRON_SECRET: z.string().optional(),
  POSTMARK_WEBHOOK_USER: z.string().optional(),
  POSTMARK_WEBHOOK_PASS: z.string().optional(),
  STORAGE_DRIVER: z.enum(["local", "s3", "r2"]).default("local"),
  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().default("us-east-1"),
  S3_ENDPOINT: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_FORCE_PATH_STYLE: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  STORAGE_SSE: z.enum(["NONE", "AES256", "aws:kms"]).default("AES256"),
  STORAGE_KMS_KEY_ID: z.string().optional(),
  NODE_ENV: z.string().optional(),
});

/** Full schema with driver/credential cross-checks. */
const envSchema = envObjectSchema.superRefine((data, ctx) => {
  if (data.EMAIL_DRIVER === "postmark" && !data.POSTMARK_TOKEN) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "POSTMARK_TOKEN required when EMAIL_DRIVER=postmark",
      path: ["POSTMARK_TOKEN"],
    });
  }
  if (data.EMAIL_DRIVER === "postmark" && !data.POSTMARK_WEBHOOK_USER) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "POSTMARK_WEBHOOK_USER required when EMAIL_DRIVER=postmark",
      path: ["POSTMARK_WEBHOOK_USER"],
    });
  }
  if (data.EMAIL_DRIVER === "postmark" && !data.POSTMARK_WEBHOOK_PASS) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "POSTMARK_WEBHOOK_PASS required when EMAIL_DRIVER=postmark",
      path: ["POSTMARK_WEBHOOK_PASS"],
    });
  }
  if (data.WHATSAPP_DRIVER === "meta") {
    if (!data.META_WHATSAPP_TOKEN) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "META_WHATSAPP_TOKEN required when WHATSAPP_DRIVER=meta",
        path: ["META_WHATSAPP_TOKEN"],
      });
    }
    if (!data.META_WHATSAPP_PHONE_ID) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "META_WHATSAPP_PHONE_ID required when WHATSAPP_DRIVER=meta",
        path: ["META_WHATSAPP_PHONE_ID"],
      });
    }
  }
  if (data.STORAGE_DRIVER === "s3" || data.STORAGE_DRIVER === "r2") {
    if (!data.S3_BUCKET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "S3_BUCKET required when STORAGE_DRIVER is s3 or r2",
        path: ["S3_BUCKET"],
      });
    }
    if (!data.S3_ACCESS_KEY_ID) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "S3_ACCESS_KEY_ID required when STORAGE_DRIVER is s3 or r2",
        path: ["S3_ACCESS_KEY_ID"],
      });
    }
    if (!data.S3_SECRET_ACCESS_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "S3_SECRET_ACCESS_KEY required when STORAGE_DRIVER is s3 or r2",
        path: ["S3_SECRET_ACCESS_KEY"],
      });
    }
  }
  if (data.STORAGE_DRIVER === "r2" && !data.S3_ENDPOINT) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "S3_ENDPOINT required when STORAGE_DRIVER=r2",
      path: ["S3_ENDPOINT"],
    });
  }
  if (data.STORAGE_SSE === "aws:kms" && !data.STORAGE_KMS_KEY_ID) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "STORAGE_KMS_KEY_ID required when STORAGE_SSE=aws:kms",
      path: ["STORAGE_KMS_KEY_ID"],
    });
  }
  if (data.NODE_ENV === "production" && !data.CRON_SECRET) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "CRON_SECRET required in production",
      path: ["CRON_SECRET"],
    });
  }
});

export type AppEnv = z.infer<typeof envObjectSchema>;

/** Encryption keys only — used by crypto module at load time. */
export function parseEncryptionEnv(
  source: Record<string, string | undefined> = process.env
) {
  const result = envObjectSchema
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

/** Full app env including DB URLs and notification drivers. */
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
    EMAIL_DRIVER: source.EMAIL_DRIVER ?? "log",
    POSTMARK_TOKEN: source.POSTMARK_TOKEN,
    WHATSAPP_DRIVER: source.WHATSAPP_DRIVER ?? "log",
    META_WHATSAPP_TOKEN: source.META_WHATSAPP_TOKEN,
    META_WHATSAPP_PHONE_ID: source.META_WHATSAPP_PHONE_ID,
    CRON_SECRET: source.CRON_SECRET,
    POSTMARK_WEBHOOK_USER: source.POSTMARK_WEBHOOK_USER,
    POSTMARK_WEBHOOK_PASS: source.POSTMARK_WEBHOOK_PASS,
    STORAGE_DRIVER: source.STORAGE_DRIVER ?? "local",
    S3_BUCKET: source.S3_BUCKET,
    S3_REGION: source.S3_REGION ?? "us-east-1",
    S3_ENDPOINT: source.S3_ENDPOINT,
    S3_ACCESS_KEY_ID: source.S3_ACCESS_KEY_ID,
    S3_SECRET_ACCESS_KEY: source.S3_SECRET_ACCESS_KEY,
    S3_FORCE_PATH_STYLE: source.S3_FORCE_PATH_STYLE,
    STORAGE_SSE: source.STORAGE_SSE ?? "AES256",
    STORAGE_KMS_KEY_ID: source.STORAGE_KMS_KEY_ID,
    NODE_ENV: source.NODE_ENV,
  });
  if (!result.success) {
    throw new ValidationError(
      `Invalid env: ${result.error.issues.map((i) => i.message).join("; ")}`
    );
  }
  return result.data;
}
