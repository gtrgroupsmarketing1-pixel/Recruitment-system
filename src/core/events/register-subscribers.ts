/**
 * Boot-time subscriber registration. Idempotent.
 */
import { registerAuditSubscriber } from "@/core/audit/audit.subscriber";
import { registerTaskSubscriber } from "@/modules/task/task.subscriber";
import { registerComplianceSubscriber } from "@/modules/compliance/compliance.subscriber";
import { registerComplianceAuditSubscriber } from "@/modules/compliance/compliance.audit.subscriber";
import { registerNotificationSubscribers } from "@/modules/notification/notification.subscribers";

let registered = false;
const unsubs: Array<() => void> = [];

export function registerSubscribers(): void {
  if (registered) return;
  unsubs.push(registerAuditSubscriber());
  unsubs.push(registerTaskSubscriber());
  unsubs.push(registerComplianceSubscriber());
  unsubs.push(registerComplianceAuditSubscriber());
  unsubs.push(registerNotificationSubscribers());
  registered = true;
}

/** Test-only reset. */
export function resetSubscriberRegistration(): void {
  for (const u of unsubs) u();
  unsubs.length = 0;
  registered = false;
}
