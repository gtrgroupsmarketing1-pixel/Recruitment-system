import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : path.endsWith(".tsx") ? [path] : [];
  });
}

describe("rtl logical properties", () => {
  it("has no physical Tailwind spacing or text alignment in app and components", () => {
    const hits = [...files("src/app"), ...files("src/components")].filter((path) =>
      /\b(ml|mr|pl|pr)-|text-left|text-right/.test(readFileSync(path, "utf8"))
    );
    expect(hits).toEqual([]);
  });
});
