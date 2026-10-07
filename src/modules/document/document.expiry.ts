export function daysRemaining(expiryDate: Date, nowMs: number): number {
  return Math.floor((expiryDate.getTime() - nowMs) / 86_400_000);
}

export function isExpiringWithin(expiryDate: Date | null, nowMs: number, withinDays: number): boolean {
  if (!expiryDate) return false;
  const days = daysRemaining(expiryDate, nowMs);
  return days <= withinDays;
}
