/**
 * Boot-time subscriber registration. Idempotent.
 */
import { registerAuditSubscriber } from "@/core/audit/audit.subscriber";
import { registerTaskSubscriber } from "@/modules/task/task.subscriber";
import { registerComplianceSubscriber } from "@/modules/compliance/compliance.subscriber";

let registered = false;
const unsubs: Array<() => void> = [];

export function registerSubscribers(): void {
  if (registered) return;
  unsubs.push(registerAuditSubscriber());
  unsubs.push(registerTaskSubscriber());
  unsubs.push(registerComplianceSubscriber());
  registered = true;
}

/** Test-only reset. */
export function resetSubscriberRegistration(): void {
  for (const u of unsubs) u();
  unsubs.length = 0;
  registered = false;
}
