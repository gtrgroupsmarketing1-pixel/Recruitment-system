/**
 * Req ID: {ClientCode}-{CountryCode}-{RoleCategoryCode}-{YYYYMM}-{Seq}
 * Example: EMR-AE-BC-202610-014
 * Pure — no I/O.
 */

export type ReqCodeParts = {
  clientCode: string;
  countryCode: string;
  roleCategoryCode: string;
  yyyymm: string;
  seq: number;
};

export function padSeq(seq: number): string {
  return String(seq).padStart(3, "0");
}

export function buildReqCode(parts: ReqCodeParts): string {
  return [
    parts.clientCode.toUpperCase(),
    parts.countryCode.toUpperCase(),
    parts.roleCategoryCode.toUpperCase(),
    parts.yyyymm,
    padSeq(parts.seq),
  ].join("-");
}

export function reqCodePrefix(parts: Omit<ReqCodeParts, "seq">): string {
  return [
    parts.clientCode.toUpperCase(),
    parts.countryCode.toUpperCase(),
    parts.roleCategoryCode.toUpperCase(),
    parts.yyyymm,
  ].join("-");
}

export function currentYyyymm(now = new Date()): string {
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${y}${m}`;
}

/** Parse trailing sequence from a code that starts with prefix-. */
export function seqFromReqCode(reqCode: string, prefix: string): number {
  if (!reqCode.startsWith(prefix + "-")) return 0;
  const tail = reqCode.slice(prefix.length + 1);
  const n = Number.parseInt(tail, 10);
  return Number.isFinite(n) ? n : 0;
}
