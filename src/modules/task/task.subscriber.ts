import { eventBus } from "@/core/events/event-bus";
import { db } from "@/core/db/client";
import { ApplicationStatusSchema } from "@/modules/application/application.schema";
import { generateTaskSpec } from "./task.generator";

export function registerTaskSubscriber(): () => void {
  return eventBus.subscribe("candidate.status_changed", async (event) => {
    const from = ApplicationStatusSchema.safeParse(event.payload.from);
    const to = ApplicationStatusSchema.safeParse(event.payload.to);
    if (!from.success || !to.success) return;

    const spec = generateTaskSpec(from.data, to.data, event.payload.reason);
    if (!spec) return;

    const generatedKey = `${event.payload.applicationId}:${event.payload.from}:${event.payload.to}`;
    const dueDate =
      spec.dueInDays === 0
        ? new Date()
        : new Date(Date.now() + spec.dueInDays * 86_400_000);

    try {
      await db.task.create({
        data: {
          tenantId: event.tenantId,
          assigneeId: event.payload.actorId,
          type: spec.type,
          refType: "CandidateApplication",
          refId: event.payload.applicationId,
          title: spec.title,
          description: spec.description,
          dueDate,
          priority: spec.priority,
          generatedKey,
        },
      });
    } catch (err) {
      if (isUniqueViolation(err)) return;
      throw err;
    }
  });
}

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: string }).code === "P2002"
  );
}
