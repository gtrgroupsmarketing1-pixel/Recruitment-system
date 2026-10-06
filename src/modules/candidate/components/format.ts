export function formatCandidateName(input: { fullName: string }): string {
  return input.fullName.trim().replace(/\s+/g, " ");
}

/** Mask middle digits. Keeps country prefix and last 4. */
export function maskPhone(phone: string): string {
  const trimmed = phone.trim();
  if (trimmed.length <= 6) return "******";
  const prefix = trimmed.startsWith("+") ? trimmed.slice(0, 3) : trimmed.slice(0, 2);
  const tail = trimmed.slice(-4);
  return `${prefix}******${tail}`;
}
