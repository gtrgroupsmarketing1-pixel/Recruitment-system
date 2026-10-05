import { PrismaClient } from "@prisma/client";
import { encryptionQueryHook } from "@/core/db/encryption.middleware";
import { getActiveTx, txStorage } from "@/core/db/tx-context";

const globalForPrisma = globalThis as unknown as {
  appPrisma?: PrismaClient;
  authPrisma?: PrismaClient;
};

function requireUrl(name: "DATABASE_URL" | "AUTH_DATABASE_URL"): string {
  const url = process.env[name];
  if (!url) {
    throw new Error(`${name} is not set`);
  }
  return url;
}

/**
 * Auth client — AUTH_DATABASE_URL (app_auth role, BYPASSRLS).
 * Use only for Auth.js adapter, signup, migrations. Never for tenant-scoped data.
 */
const authPlain =
  globalForPrisma.authPrisma ??
  new PrismaClient({
    datasources: { db: { url: process.env.AUTH_DATABASE_URL ?? process.env.DATABASE_URL } },
  });

/**
 * App client base — DATABASE_URL (app_tenant role, RLS enforced).
 * RLS-enforced. Never import in auth flows or signup. Never call outside withTenant.
 */
const appPlain =
  globalForPrisma.appPrisma ??
  new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL } },
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.authPrisma = authPlain;
  globalForPrisma.appPrisma = appPlain;
}

/** Encryption middleware on the app client (including txs started from it). */
const appExtended = appPlain.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        return encryptionQueryHook({
          model,
          operation,
          args: args as Record<string, unknown>,
          query: query as (a: Record<string, unknown>) => Promise<unknown>,
        });
      },
    },
  },
});

/**
 * RLS bypassed. Auth.js adapter + signup + privileged test setup only.
 * Never use for tenant-scoped service/repo queries — those must go through db inside withTenant.
 */
export const authPrisma = authPlain;

/**
 * RLS-enforced plain app client (no Proxy). Isolation tests only.
 * Services must use `db` inside withTenant, not this.
 */
export const appPrisma = appPlain;

/** @deprecated Prefer authPrisma. Alias retained for one-release compatibility. */
export const basePrisma = authPrisma;

/**
 * RLS-enforced app client. Routes to the active withTenant() transaction when present.
 * Never import in auth flows or signup. Never call outside withTenant (throws in dev).
 */
export const db = new Proxy(appExtended as unknown as PrismaClient, {
  get(target, prop, receiver) {
    const tx = getActiveTx();
    if (
      !tx &&
      typeof prop === "string" &&
      !prop.startsWith("$") &&
      !prop.startsWith("_") &&
      prop !== "then" &&
      prop !== "catch" &&
      prop !== "finally"
    ) {
      if (process.env.NODE_ENV !== "production") {
        throw new Error(
          `db.${prop} accessed without tenant context. Wrap in withTenant().`
        );
      }
    }
    return Reflect.get(tx ?? target, prop, receiver);
  },
}) as PrismaClient;

/**
 * Opens a transaction-local set_config('app.tenant_id', ..., true) and runs fn
 * with db Proxy resolving to that transaction client.
 * Idempotent: reuses an already-active tenant tx.
 */
export async function withTenant<T>(
  tenantId: string,
  fn: () => Promise<T>
): Promise<T> {
  if (getActiveTx()) {
    return fn();
  }
  return (appExtended as unknown as PrismaClient).$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;
    return txStorage.run(tx, fn);
  });
}

// Touch requireUrl in types/docs — callers must set env before runtime queries.
void requireUrl;
