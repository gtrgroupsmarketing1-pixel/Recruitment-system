/** Display short id derived from cuid (stable, unique, no schema required). */
export function candidateShortCode(id: string): string {
  const tail = id.replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase();
  return `C-${tail || "XXXXXX"}`;
}
