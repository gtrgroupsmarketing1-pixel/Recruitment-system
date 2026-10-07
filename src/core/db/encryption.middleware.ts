/**
 * Prisma encryption middleware.
 *
 * Contract:
 * - Services always pass plaintext on create/update.
 * - Reads always return plaintext.
 * - Middleware does not detect "already encrypted" values (no heuristic).
 * - Nested writes are NOT encrypted this session — services must write
 *   sensitive fields only on top-level model operations.
 *   BACKLOG: Session 04 deferral: nested-write encryption.
 *
 * Do not log plaintext, ciphertext, or keys.
 */

import { encrypt, decrypt, blindIndex } from "@/core/security/crypto";
import {
  SENSITIVE_FIELDS,
  type SensitiveModel,
} from "@/core/db/encryption.registry";

const WRITE_OPS = new Set([
  "create",
  "update",
  "upsert",
  "updateMany",
  "createMany",
]);

const READ_OPS = new Set([
  "findFirst",
  "findMany",
  "findUnique",
  "findUniqueOrThrow",
  "findFirstOrThrow",
]);

const WHERE_OPS = new Set([
  "findFirst",
  "findMany",
  "findUnique",
  "findUniqueOrThrow",
  "findFirstOrThrow",
  "count",
  "update",
  "updateMany",
  "delete",
  "deleteMany",
]);

function isSensitiveModel(model: string): model is SensitiveModel {
  return model in SENSITIVE_FIELDS;
}

function encryptDataFields(
  model: SensitiveModel,
  data: Record<string, unknown> | undefined
): void {
  if (!data || typeof data !== "object") return;
  const fields = SENSITIVE_FIELDS[model];
  for (const [field, meta] of Object.entries(fields)) {
    if (!(field in data)) continue;
    const value = data[field];
    if (value === undefined) continue;
    if (value === null) {
      if (meta.bidx) data[meta.bidx] = null;
      continue;
    }
    if (typeof value === "string") {
      data[field] = encrypt(value);
      if (meta.bidx) data[meta.bidx] = blindIndex(value);
    }
  }
}

function rewriteWhere(
  model: SensitiveModel,
  where: Record<string, unknown> | undefined
): void {
  if (!where || typeof where !== "object") return;
  const fields = SENSITIVE_FIELDS[model];
  for (const [field, meta] of Object.entries(fields)) {
    if (!meta.bidx) continue;
    if (!(field in where)) continue;
    const value = where[field];
    if (typeof value === "string") {
      delete where[field];
      where[meta.bidx] = blindIndex(value);
    } else if (
      value &&
      typeof value === "object" &&
      "equals" in (value as object) &&
      typeof (value as { equals: unknown }).equals === "string"
    ) {
      const plain = (value as { equals: string }).equals;
      delete where[field];
      where[meta.bidx] = blindIndex(plain);
    }
  }
}

function decryptRow(
  model: SensitiveModel,
  row: Record<string, unknown> | null | undefined
): void {
  if (!row || typeof row !== "object") return;
  const fields = SENSITIVE_FIELDS[model];
  for (const field of Object.keys(fields)) {
    const value = row[field];
    if (typeof value === "string" && value.length > 0) {
      row[field] = decrypt(value);
    }
  }
}

function decryptResult(model: SensitiveModel, result: unknown): unknown {
  if (result === null || result === undefined) return result;
  if (Array.isArray(result)) {
    for (const row of result) {
      if (row && typeof row === "object") {
        decryptRow(model, row as Record<string, unknown>);
      }
    }
    return result;
  }
  if (typeof result === "object") {
    decryptRow(model, result as Record<string, unknown>);
  }
  return result;
}

/**
 * Prisma $extends query hook body for a single operation.
 * Nested-write encryption is intentionally not handled this session.
 */
export async function encryptionQueryHook(params: {
  model: string | undefined;
  operation: string;
  args: Record<string, unknown>;
  query: (args: Record<string, unknown>) => Promise<unknown>;
}): Promise<unknown> {
  const { model, operation, args, query } = params;
  if (!model || !isSensitiveModel(model)) {
    return query(args);
  }

  const nextArgs = { ...args };

  if (WHERE_OPS.has(operation) && nextArgs.where) {
    rewriteWhere(
      model,
      nextArgs.where as Record<string, unknown>
    );
  }

  if (WRITE_OPS.has(operation)) {
    if (operation === "upsert") {
      const create = nextArgs.create as Record<string, unknown> | undefined;
      const update = nextArgs.update as Record<string, unknown> | undefined;
      encryptDataFields(model, create);
      encryptDataFields(model, update);
    } else if (operation === "createMany") {
      const data = nextArgs.data;
      if (Array.isArray(data)) {
        for (const row of data) {
          if (row && typeof row === "object") {
            encryptDataFields(model, row as Record<string, unknown>);
          }
        }
      } else if (data && typeof data === "object") {
        encryptDataFields(model, data as Record<string, unknown>);
      }
    } else {
      encryptDataFields(model, nextArgs.data as Record<string, unknown>);
    }
  }

  const result = await query(nextArgs);

  if (READ_OPS.has(operation)) {
    return decryptResult(model, result);
  }

  // create / update / upsert return the row — decrypt so callers see plaintext
  if (
    operation === "create" ||
    operation === "update" ||
    operation === "upsert"
  ) {
    return decryptResult(model, result);
  }

  return result;
}
