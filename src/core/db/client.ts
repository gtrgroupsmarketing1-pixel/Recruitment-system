import type { PrismaClient } from "@prisma/client";
import { getActiveTx, txStorage } from "@/core/db/tx-context";
import {
  appExtended,
  appPlain,
  authPlain,
} from "@/core/db/prisma-instances";
import { logger } from "@/lib/logger";
import { eventBus } from "@/core/events/event-bus";

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
 * Tenant-scoped transaction without post-commit event dispatch.
 * Used by eventBus.dispatchPending to avoid recursive dispatch.
 */
export async function runInTenantTx<T>(
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

/**
 * Opens a transaction-local set_config('app.tenant_id', ..., true) and runs fn
 * with db Proxy resolving to that transaction client.
 * After commit, dispatches pending DomainEvent rows (transactional outbox).
 * Idempotent for nested calls: reuses an already-active tenant tx (no nested dispatch).
 */
export async function withTenant<T>(
  tenantId: string,
  fn: () => Promise<T>
): Promise<T> {
  if (getActiveTx()) {
    return fn();
  }
  const result = await runInTenantTx(tenantId, fn);
  // Post-commit outbox drain. Failures are logged; rows stay pending for retry.
  try {
    await eventBus.dispatchPending(tenantId);
  } catch (err) {
    logger.error(
      { err: err instanceof Error ? err.message : "dispatch_failed", tenantId },
      "event dispatch failed"
    );
  }
  return result;
}
