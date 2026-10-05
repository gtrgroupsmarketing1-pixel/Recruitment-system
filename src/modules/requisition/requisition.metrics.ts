/**
 * SLA is computed at read time. Never stored.
 *
 * Days remaining = targetOnboardingDate - today (UTC calendar days).
 * Boundary (matches Session 08 tests): strictly fewer than 30 days → RED.
 * Exactly 30 through 44 → AMBER. 45 and above → GREEN.
 * (Prose said 31–45 AMBER; the listed cases mark 45 as GREEN. Tests win.)
 */
export type SlaFlag = "RED" | "AMBER" | "GREEN";

export function utcDayNumber(d: Date): number {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

export function daysRemaining(target: Date, today = new Date()): number {
  const ms = utcDayNumber(target) - utcDayNumber(today);
  return Math.round(ms / 86_400_000);
}

export function computeSlaFlag(
  targetOnboardingDate: Date | null | undefined,
  today = new Date()
): SlaFlag | null {
  if (!targetOnboardingDate) return null;
  const days = daysRemaining(targetOnboardingDate, today);
  if (days < 30) return "RED";
  if (days < 45) return "AMBER";
  return "GREEN";
}

/**
 * Fulfillment is computed at read time. Never stored.
 * pct clamped to 100. target 0 → 0.
 */
export function computeFulfillmentPct(mobilized: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(100, Math.round((100 * mobilized) / target));
}
