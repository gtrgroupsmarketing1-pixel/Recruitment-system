import { router } from "@/trpc/init";
import { applicationRouter } from "@/modules/application/application.router";
import { requisitionRouter } from "@/modules/requisition/requisition.router";

export const appRouter = router({
  application: applicationRouter,
  requisition: requisitionRouter,
});

export type AppRouter = typeof appRouter;
