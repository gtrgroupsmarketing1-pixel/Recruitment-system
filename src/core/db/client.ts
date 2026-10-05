import { PrismaClient } from "@prisma/client";
import { encryptionQueryHook } from "@/core/db/encryption.middleware";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const base =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Never pass sensitive fields through $queryRaw / $executeRaw —
    // raw queries bypass encryption middleware.
  });

/**
 * Prisma client with encryption middleware.
 * WARNING: $queryRaw and $executeRaw bypass encryption. Never pass
 * SENSITIVE_FIELDS through raw queries.
 */
export const db = base.$extends({
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
}) as unknown as PrismaClient;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = base;
}
