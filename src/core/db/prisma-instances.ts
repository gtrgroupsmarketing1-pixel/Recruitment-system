/**
 * Raw Prisma client instances. No Proxy, no withTenant, no event bus.
 * Imported by client.ts and event-bus.ts without forming a cycle.
 */
import { PrismaClient } from "@prisma/client";
import { encryptionQueryHook } from "@/core/db/encryption.middleware";

const globalForPrisma = globalThis as unknown as {
  appPrisma?: PrismaClient;
  authPrisma?: PrismaClient;
};

function dbUrl(preferred?: string | undefined): string {
  const url = preferred ?? process.env.DATABASE_URL ?? process.env.AUTH_DATABASE_URL;
  if (!url) {
    // Avoid hard-crash at module load; queries will still fail with a clear message.
    return "postgresql://invalid:invalid@127.0.0.1:1/invalid";
  }
  return url;
}

/** AUTH_DATABASE_URL — app_auth, BYPASSRLS */
export const authPlain =
  globalForPrisma.authPrisma ??
  new PrismaClient({
    datasources: {
      db: { url: dbUrl(process.env.AUTH_DATABASE_URL ?? process.env.DATABASE_URL) },
    },
  });

/** DATABASE_URL — app_tenant, RLS enforced */
export const appPlain =
  globalForPrisma.appPrisma ??
  new PrismaClient({
    datasources: { db: { url: dbUrl(process.env.DATABASE_URL) } },
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.authPrisma = authPlain;
  globalForPrisma.appPrisma = appPlain;
}

/** App client with encryption middleware (DomainEvent has no encrypted fields). */
export const appExtended = appPlain.$extends({
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
