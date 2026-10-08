import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

function walk(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, acc);
    else if (name.endsWith(".action.ts") || name === "actions.ts") acc.push(p);
  }
  return acc;
}

describe("server action role guards", () => {
  it("every use-server action file calls requirePermission", () => {
    const roots = ["src/modules", "src/app"];
    const files: string[] = [];
    for (const r of roots) {
      try {
        walk(r, files);
      } catch {
        /* missing root */
      }
    }
    expect(files.length).toBeGreaterThan(5);
    const missing: string[] = [];
    for (const f of files) {
      const src = readFileSync(f, "utf8");
      if (!src.includes("requirePermission")) {
        missing.push(f);
      }
    }
    expect(missing).toEqual([]);
  });

  it("no interactive app path still uses withTenant", () => {
    const roots = ["src/app", "src/modules", "src/trpc"];
    const hits: string[] = [];
    for (const r of roots) {
      try {
        for (const f of walkTs(r)) {
          const src = readFileSync(f, "utf8");
          // jobs/webhooks live under src/core; app/modules should not call withTenant
          if (/withTenant\s*\(/.test(src) && !src.includes("@deprecated")) {
            hits.push(f);
          }
        }
      } catch {
        /* missing */
      }
    }
    expect(hits).toEqual([]);
  });
});

function walkTs(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walkTs(p, acc);
    else if (name.endsWith(".ts") || name.endsWith(".tsx")) acc.push(p);
  }
  return acc;
}
