import { describe, it, expect } from "vitest";
import { wafidConnector } from "@/core/connectors/wafid.connector";

describe("wafid status map", () => {
  it("maps FIT to APPROVED", () => {
    expect(wafidConnector.mapStatus("FIT")).toBe("APPROVED");
  });
  it("maps UNFIT to REJECTED", () => {
    expect(wafidConnector.mapStatus("UNFIT")).toBe("REJECTED");
  });
  it("maps EXPIRED", () => {
    expect(wafidConnector.mapStatus("EXPIRED")).toBe("EXPIRED");
  });
  it("maps Processing to IN_PROGRESS", () => {
    expect(wafidConnector.mapStatus("Processing")).toBe("IN_PROGRESS");
  });
  it("maps unknown to UNKNOWN", () => {
    expect(wafidConnector.mapStatus("UNKNOWN THING")).toBe("UNKNOWN");
  });
});
