/**
 * Boot-time subscriber registration. Idempotent.
 */
import { registerAuditSubscriber } from "@/core/audit/audit.subscriber";
import { registerTaskSubscriber } from "@/modules/task/task.subscriber";

let registered = false;
const unsubs: Array<() => void> = [];

export function registerSubscribers(): void {
  if (registered) return;
  unsubs.push(registerAuditSubscriber());
  unsubs.push(registerTaskSubscriber());
  registered = true;
}

/** Test-only reset. */
export function resetSubscriberRegistration(): void {
  for (const u of unsubs) u();
  unsubs.length = 0;
  registered = false;
}
