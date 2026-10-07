import { describe, it, expect } from "vitest";
import { mohreConnector } from "@/core/connectors/mohre.connector";
import { dmwConnector } from "@/core/connectors/dmw.connector";

describe("MOHRE and DMW skeletons", () => {
  it("MOHRE returns UNKNOWN / NOT_IMPLEMENTED", async () => {
    const result = await mohreConnector.check({
      trackingId: "123456",
      credentials: {},
      timeoutMs: 1000,
      userAgent: "test",
    });
    expect(result.status).toBe("UNKNOWN");
    expect(result.rawStatus).toBe("NOT_IMPLEMENTED");
  });

  it("DMW returns UNKNOWN / NOT_IMPLEMENTED", async () => {
    const result = await dmwConnector.check({
      trackingId: "123456",
      credentials: {},
      timeoutMs: 1000,
      userAgent: "test",
    });
    expect(result.status).toBe("UNKNOWN");
    expect(result.rawStatus).toBe("NOT_IMPLEMENTED");
  });
});
