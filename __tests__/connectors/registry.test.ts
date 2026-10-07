import { describe, it, expect } from "vitest";
import { getConnector, listConnectors } from "@/core/connectors/registry";

describe("connector registry", () => {
  it("returns wafid connector", () => {
    const c = getConnector("wafid");
    expect(c?.id).toBe("wafid");
    expect(c?.displayName).toContain("Wafid");
  });

  it("returns null for unknown id", () => {
    expect(getConnector("nonexistent")).toBeNull();
  });

  it("every registered connector has a unique id", () => {
    const ids = listConnectors().map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain("wafid");
    expect(ids).toContain("mohre");
    expect(ids).toContain("dmw");
  });
});
