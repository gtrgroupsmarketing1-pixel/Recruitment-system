import { router } from "@/trpc/init";
import { applicationRouter } from "@/modules/application/application.router";
import { candidateRouter } from "@/modules/candidate/candidate.router";
import { requisitionRouter } from "@/modules/requisition/requisition.router";
import { taskRouter } from "@/modules/task/task.router";

export const appRouter = router({
  application: applicationRouter,
  candidate: candidateRouter,
  requisition: requisitionRouter,
  task: taskRouter,
});

export type AppRouter = typeof appRouter;
