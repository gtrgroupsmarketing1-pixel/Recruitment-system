import { AsyncLocalStorage } from "node:async_hooks";
import type { UserRole } from "@prisma/client";

export type SessionScope = {
  kind: "USER";
  tenantId: string;
  userId: string;
  role: UserRole;
  branchId: string | null;
};

export type SystemScope = {
  kind: "SYSTEM";
  tenantId: string;
  reason: string;
};

export type Scope = SessionScope | SystemScope;

export const scopeStorage = new AsyncLocalStorage<Scope>();

export function getScope(): Scope {
  const scope = scopeStorage.getStore();
  if (!scope) {
    throw new Error("No scope set — call withUserScope or withSystemScope");
  }
  return scope;
}

export function getUserScope(): SessionScope {
  const scope = getScope();
  if (scope.kind !== "USER") {
    throw new Error("Expected user scope");
  }
  return scope;
}

export function tryGetScope(): Scope | undefined {
  return scopeStorage.getStore();
}
