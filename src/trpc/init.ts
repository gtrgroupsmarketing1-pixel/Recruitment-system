import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { UserRole } from "@prisma/client";
import { auth } from "@/core/auth/auth.config";
import { withUserScope } from "@/core/db/client";
import { logger } from "@/lib/logger";
import { cookies } from "next/headers";
import { ForbiddenError, RateLimitError, UnauthorizedError } from "@/lib/errors";
import { assertRateLimit } from "@/core/security/rate-limit";
import { assertNoCandidateOnStaffApi } from "@/core/candidate-auth/session";

export type TrpcContext = {
  tenantId: string | null;
  userId: string | null;
  role: UserRole | null;
  branchId: string | null;
  clientCompanyId: string | null;
};

/**
 * Builds request context. Does NOT open a tenant transaction here —
 * withUserScope wraps the procedure body in protectedProcedure, otherwise
 * the transaction would end before the procedure runs.
 */
export async function createTRPCContext(): Promise<TrpcContext> {
  const session = await auth();
  try {
    const jar = await cookies();
    assertNoCandidateOnStaffApi(jar.get("candidate_session")?.value, Boolean(session?.user?.id));
  } catch (error) {
    if (error instanceof UnauthorizedError) throw error;
  }
  return {
    tenantId: session?.tenantId ?? null,
    userId: session?.user?.id ?? null,
    role: (session?.user?.role ?? session?.role ?? null) as UserRole | null,
    branchId: session?.user?.branchId ?? session?.branchId ?? null,
    clientCompanyId: session?.user?.clientCompanyId ?? session?.clientCompanyId ?? null,
  };
}

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    if (error.cause instanceof ForbiddenError) {
      return {
        ...shape,
        data: { ...shape.data, code: "FORBIDDEN", httpStatus: 403 },
        message: error.cause.message,
      };
    }
    return shape;
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

/**
 * Requires session tenant + user, then runs the procedure inside withUserScope
 * so RLS set_config, scope storage, and the db Proxy share one transaction.
 */
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.tenantId || !ctx.userId || !ctx.role) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  try {
    await assertRateLimit("api:trpc", ctx.userId);
  } catch (error) {
    if (error instanceof RateLimitError) {
      throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: error.message });
    }
    throw error;
  }
  const tenantId = ctx.tenantId;
  const userId = ctx.userId;
  const role = ctx.role;
  const branchId = ctx.branchId;
  const clientCompanyId = ctx.clientCompanyId;
  const log = logger.child({ tenantId, userId, role });
  return withUserScope(
    {
      kind: "USER",
      tenantId,
      userId,
      role,
      branchId,
      clientCompanyId,
    },
    async () =>
      next({
        ctx: {
          tenantId,
          userId,
          role,
          branchId,
          clientCompanyId,
          log,
        },
      })
  );
});
