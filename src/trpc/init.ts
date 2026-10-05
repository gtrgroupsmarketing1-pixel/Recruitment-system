import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { auth } from "@/core/auth/auth.config";
import { withTenant } from "@/core/db/client";
import { logger } from "@/lib/logger";

export type TrpcContext = {
  tenantId: string | null;
  userId: string | null;
};

/**
 * Builds request context. Does NOT open a tenant transaction here —
 * withTenant wraps the procedure body in protectedProcedure, otherwise
 * the transaction would end before the procedure runs.
 */
export async function createTRPCContext(): Promise<TrpcContext> {
  const session = await auth();
  return {
    tenantId: session?.tenantId ?? null,
    userId: session?.user?.id ?? null,
  };
}

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

/**
 * Requires session tenant + user, then runs the procedure inside withTenant
 * so RLS set_config and the db Proxy share one transaction for the call.
 */
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.tenantId || !ctx.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  const tenantId = ctx.tenantId;
  const userId = ctx.userId;
  const log = logger.child({ tenantId, userId });
  return withTenant(tenantId, async () =>
    next({
      ctx: {
        tenantId,
        userId,
        log,
      },
    })
  );
});
