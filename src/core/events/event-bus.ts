/**
 * Transactional outbox event bus.
 *
 * publish() — writes DomainEvent inside the active withTenant tx. Does NOT dispatch.
 * dispatchPending() — after commit, loads undispatched rows and invokes subscribers.
 *
 * Delivery: at-least-once. Subscribers must be idempotent.
 * Subscriber errors are isolated per handler; a throw leaves dispatchedAt null for retry.
 *
 * Import cycle: this module does NOT import client.ts.
 * - publish uses getActiveTx() from tx-context
 * - dispatchPending uses runInTenantTx from client (client imports eventBus only for
 *   post-commit; runInTenantTx does not call dispatchPending → no recursion)
 *
 * Actually runInTenantTx is defined in client.ts which imports eventBus — at module
 * load time that is fine (dispatchPending is only called at runtime after both load).
 * To keep the graph acyclic at the type/analysis level, dispatchPending uses appExtended
 * + txStorage directly via prisma-instances + tx-context only.
 */

import { getActiveTx, txStorage } from "@/core/db/tx-context";
import { appExtended } from "@/core/db/prisma-instances";
import { EventBusError } from "@/lib/errors";
import type {
  DomainEvent,
  DomainEventType,
  DomainEventPayloads,
} from "@/core/events/event.types";
import type { PrismaClient } from "@prisma/client";

type Handler<T extends DomainEventType> = (
  event: DomainEvent<T>
) => Promise<void>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const registry = new Map<DomainEventType, Set<Handler<any>>>();

async function runTenantTx<T>(tenantId: string, fn: () => Promise<T>): Promise<T> {
  const active = getActiveTx();
  if (active) {
    return fn();
  }
  return (appExtended as unknown as PrismaClient).$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;
    return txStorage.run(tx, fn);
  });
}

export const eventBus = {
  /**
   * Persist event inside the current tenant transaction. Does not call subscribers.
   * Must be invoked inside withTenant / runInTenantTx.
   */
  async publish<T extends DomainEventType>(
    event: DomainEvent<T>
  ): Promise<void> {
    const tx = getActiveTx();
    if (!tx) {
      throw new EventBusError(
        "eventBus.publish must be called inside withTenant (no active transaction)"
      );
    }
    await tx.domainEvent.create({
      data: {
        tenantId: event.tenantId,
        type: event.type,
        payload: event.payload as object,
        dispatchedAt: null,
      },
    });
  },

  /**
   * Drain undispatched DomainEvent rows for tenantId and invoke subscribers.
   * Opens its own tenant tx (not nested post-commit of withTenant).
   */
  async dispatchPending(tenantId: string): Promise<void> {
    await runTenantTx(tenantId, async () => {
      const tx = getActiveTx();
      if (!tx) {
        throw new EventBusError("dispatchPending: missing tenant transaction");
      }

      const rows = await tx.domainEvent.findMany({
        where: { tenantId, dispatchedAt: null },
        orderBy: { createdAt: "asc" },
      });

      for (const row of rows) {
        const type = row.type as DomainEventType;
        const handlers = registry.get(type);
        const event = {
          type,
          tenantId: row.tenantId,
          payload: row.payload as DomainEventPayloads[DomainEventType],
        } as DomainEvent;

        let allOk = true;
        if (handlers && handlers.size > 0) {
          for (const handler of handlers) {
            try {
              await handler(event);
            } catch {
              allOk = false;
            }
          }
        }

        // No subscribers → silent consume. Any handler failure → leave pending.
        if (allOk) {
          await tx.domainEvent.update({
            where: { id: row.id },
            data: { dispatchedAt: new Date() },
          });
        }
      }
    });
  },

  subscribe<T extends DomainEventType>(
    type: T,
    handler: Handler<T>
  ): () => void {
    let set = registry.get(type);
    if (!set) {
      set = new Set();
      registry.set(type, set);
    }
    set.add(handler);
    return () => {
      set!.delete(handler);
    };
  },
};
