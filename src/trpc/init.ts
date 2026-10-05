import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { auth } from "@/core/auth/auth.config";

export type TrpcContext = {
  tenantId: string | null;
  userId: string | null;
};

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

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.tenantId || !ctx.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
    },
  });
});
