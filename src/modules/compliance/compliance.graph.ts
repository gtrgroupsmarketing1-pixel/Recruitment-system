import { ValidationError } from "@/lib/errors";
import { StageLockedError } from "@/lib/errors";

export type StepNode = {
  stepOrder: number;
  name: string;
  dependsOnStepOrder: number | null;
};

export function validateStepGraph(steps: StepNode[]): void {
  const orders = steps.map((s) => s.stepOrder);
  if (new Set(orders).size !== orders.length) {
    throw new ValidationError("stepOrder must be unique within a template");
  }
  const known = new Set(orders);
  for (const step of steps) {
    const dep = step.dependsOnStepOrder;
    if (dep === null) continue;
    if (dep === step.stepOrder) {
      throw new ValidationError(`${step.name} cannot depend on itself`);
    }
    if (!known.has(dep)) {
      throw new ValidationError(`${step.name} depends on missing step ${dep}`);
    }
    if (dep >= step.stepOrder) {
      throw new ValidationError(
        `${step.name} cannot depend on a later or equal step`
      );
    }
  }
  const byOrder = new Map(steps.map((s) => [s.stepOrder, s]));
  const visiting = new Set<number>();
  const visited = new Set<number>();
  function walk(order: number): void {
    if (visited.has(order)) return;
    if (visiting.has(order)) {
      throw new ValidationError("step dependencies contain a cycle");
    }
    visiting.add(order);
    const node = byOrder.get(order);
    if (node?.dependsOnStepOrder != null) walk(node.dependsOnStepOrder);
    visiting.delete(order);
    visited.add(order);
  }
  for (const order of orders) walk(order);
}

export function assertStepUnlocked(input: {
  stepName: string;
  dependsOnName: string | null;
  dependsOnStatus: string | null;
}): void {
  if (input.dependsOnName === null && input.dependsOnStatus === null) return;
  if (input.dependsOnStatus !== "COMPLETED") {
    throw new StageLockedError(input.stepName, input.dependsOnName ?? "unknown");
  }
}
