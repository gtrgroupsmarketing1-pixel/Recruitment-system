import { AsyncLocalStorage } from "node:async_hooks";
import { authPrisma } from "@/core/db/client";
import { getActiveTx, txStorage } from "@/core/db/tx-context";

export type CandidateScope = {
  kind: "CANDIDATE";
  tenantId: string;
  candidateId: string;
};

export const candidateScopeStorage = new AsyncLocalStorage<CandidateScope>();

export function getCandidateScope(): CandidateScope {
  const scope = candidateScopeStorage.getStore();
  if (!scope) throw new Error("No candidate scope");
  return scope;
}

export async function withCandidateScope<T>(scope: CandidateScope, fn: () => Promise<T>): Promise<T> {
  if (getActiveTx()) return candidateScopeStorage.run(scope, fn);
  return authPrisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.tenant_id', ${scope.tenantId}, true)`;
    return txStorage.run(tx, () => candidateScopeStorage.run(scope, fn));
  });
}
