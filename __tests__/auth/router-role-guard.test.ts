import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

function walk(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, acc);
    else if (name.endsWith(".router.ts")) acc.push(p);
  }
  return acc;
}

describe("router role guards", () => {
  it("every .mutation and .query in routers has requirePermission nearby", () => {
    const files = walk("src/modules");
    expect(files.length).toBeGreaterThan(3);
    const missing: string[] = [];
    for (const f of files) {
      const src = readFileSync(f, "utf8");
      const procs = (src.match(/\.(mutation|query)\(/g) ?? []).length;
      const guards = (src.match(/requirePermission\(/g) ?? []).length;
      if (procs > 0 && guards < procs) {
        missing.push(`${f}: procedures=${procs} guards=${guards}`);
      }
    }
    expect(missing).toEqual([]);
  });
});
