import { PrismaClient } from "@prisma/client";
import { encryptionQueryHook } from "@/core/db/encryption.middleware";
import { getActiveTx, txStorage } from "@/core/db/tx-context";

const globalForPrisma = globalThis as unknown as {
  prismaBase?: PrismaClient;
};

/**
 * Plain client — migrations / RLS admin only. Do not import in services.
 * WARNING: $queryRaw / $executeRaw bypass encryption middleware.
 */
const plain =
  globalForPrisma.prismaBase ??
  new PrismaClient({
    // Never pass sensitive fields through $queryRaw / $executeRaw.
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prismaBase = plain;
}

/** Extended client: encryption on every model operation (including txs started here). */
const extended = plain.$extends({
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

export const basePrisma = plain;

/**
 * App-facing client. Routes to the active withTenant() transaction client when
 * one is in AsyncLocalStorage; otherwise the extended root client.
 *
 * In non-production, model access without an active tenant tx throws — wrap in withTenant().
 */
export const db = new Proxy(extended as unknown as PrismaClient, {
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
  // Use extended so encryption middleware applies inside the transaction.
  return (extended as unknown as PrismaClient).$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;
    return txStorage.run(tx, fn);
  });
}
