import { AsyncLocalStorage } from "node:async_hooks";

export const tenantStorage = new AsyncLocalStorage<{ tenantId: string }>();

export function getTenantId(): string {
  const ctx = tenantStorage.getStore();
  if (!ctx?.tenantId) {
    throw new Error("No tenant context — request not authenticated");
  }
  return ctx.tenantId;
}

export async function runWithTenant<T>(
  tenantId: string,
  fn: () => Promise<T>
): Promise<T> {
  return tenantStorage.run({ tenantId }, fn);
}
