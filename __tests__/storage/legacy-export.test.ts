import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "vitest";

describe("storage access", () => {
  it("does not export the legacy storage singleton", () => {
    const src = readFileSync(resolve(process.cwd(), "src/core/storage/storage.client.ts"), "utf8");
    expect(src).not.toMatch(/^export const storage\b/m);
    expect(src).toContain("export function getStorage");
    // Compile-time guard: `import { storage }` must fail. Kept as a comment so a
    // future maintainer does not reintroduce the dual access pattern.
  });
});
