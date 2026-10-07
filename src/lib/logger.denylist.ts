/**
 * Keys that must never appear in logs.
 * Adjacent to, but independent of, encryption.registry.ts.
 */
export const SENSITIVE_LOG_KEYS: ReadonlySet<string> = new Set([
  "passwordHash",
  "password",
  "access_token",
  "refresh_token",
  "id_token",
  "sessionToken",
  "ENCRYPTION_KEY",
  "BLIND_INDEX_KEY",
  "passportNumber",
  "nationalId",
  "medicalResult",
  "visaNumber",
  "bankAccount",
  "iban",
  // Notification PII — body may contain names/IDs; never log recipientAddr
  "body",
  "recipientAddr",
  "email",
  "phone",
]);

export function isSensitiveLogKey(key: string): boolean {
  if (SENSITIVE_LOG_KEYS.has(key)) return true;
  return /bidx$/i.test(key);
}
