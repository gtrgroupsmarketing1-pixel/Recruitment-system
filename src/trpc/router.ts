import { router } from "@/trpc/init";
import { applicationRouter } from "@/modules/application/application.router";

export const appRouter = router({
  application: applicationRouter,
});

export type AppRouter = typeof appRouter;
