// NOTE: Character entities in source (&, <, etc.) are written as
// \u0026-style escapes because tooling in some environments strips raw
// HTML entities from source files, which breaks the string literals.
// Do not "clean up" these escapes without verifying the build pipeline.
const AMP = "\u0026amp;";
const LT = "\u0026lt;";
const GT = "\u0026gt;";
const QUOT = "\u0026quot;";
const APOS = "\u0026#39;";

export function escapeHtml(s: string): string {
  return s
    .replace(/\u0026/g, AMP)
    .replace(/</g, LT)
    .replace(/>/g, GT)
    .replace(/"/g, QUOT)
    .replace(/'/g, APOS);
}
