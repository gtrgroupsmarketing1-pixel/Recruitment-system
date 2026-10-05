/**
 * Boot-time subscriber registration. Idempotent.
 */
import { registerAuditSubscriber } from "@/core/audit/audit.subscriber";

let registered = false;
let unsubscribe: (() => void) | null = null;

export function registerSubscribers(): void {
  if (registered) return;
  unsubscribe = registerAuditSubscriber();
  registered = true;
}

/** Test-only reset. */
export function resetSubscriberRegistration(): void {
  unsubscribe?.();
  unsubscribe = null;
  registered = false;
}
