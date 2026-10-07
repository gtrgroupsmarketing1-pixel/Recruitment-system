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
  });
  if (!result.success) {
    throw new ValidationError(
      `Invalid env: ${result.error.issues.map((i) => i.message).join("; ")}`
    );
  }
  return result.data;
}
