/**
 * Inclusive upper bounds: 0-7 within7, 8-15 within15, 16-30 within30.
 * Past dates are expired and are not also placed in within7.
 */
export type ExpiryBucket = "expired" | "within7" | "within15" | "within30" | "later";

export function expiryBucket(expiryDate: Date, today: Date): ExpiryBucket {
  const days = Math.floor((expiryDate.getTime() - today.getTime()) / 86_400_000);
  if (days < 0) return "expired";
  if (days <= 7) return "within7";
  if (days <= 15) return "within15";
  if (days <= 30) return "within30";
  return "later";
}
