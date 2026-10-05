import { AsyncLocalStorage } from "node:async_hooks";
import type { Prisma } from "@prisma/client";

export const txStorage = new AsyncLocalStorage<Prisma.TransactionClient>();

export function getActiveTx(): Prisma.TransactionClient | undefined {
  return txStorage.getStore();
}
