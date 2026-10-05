import { describe, expect, it } from "vitest";
import { formatFulfillment, formatSlaFlag } from "@/modules/requisition/components/format";

describe("format", () => {
  it("null sla is empty", () => {
    expect(formatSlaFlag(null)).toEqual({ label: "", className: "", aria: "" });
  });

  it("RED has red classes", () => {
    const view = formatSlaFlag("RED");
    expect(view.label).toBe("RED");
    expect(view.className).toContain("red");
  });

  it("0 / 10", () => {
    expect(formatFulfillment(0, 10)).toEqual({ pct: 0, label: "0 / 10" });
  });

  it("7 / 10", () => {
    expect(formatFulfillment(7, 10)).toEqual({ pct: 70, label: "7 / 10" });
  });

  it("15 / 10 clamps pct", () => {
    expect(formatFulfillment(15, 10)).toEqual({ pct: 100, label: "15 / 10" });
  });
});
