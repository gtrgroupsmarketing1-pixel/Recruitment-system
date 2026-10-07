import { describe, it, expect } from "vitest";
import { assertAttestationOrder } from "@/modules/compliance/compliance.attestation";
import { StageLockedError } from "@/lib/errors";

describe("attestation order", () => {
  it("allows order 1 without a predecessor", () => {
    expect(() =>
      assertAttestationOrder({
        order: 1,
        authority: "NOTARY",
        previousStatus: null,
        previousAuthority: null,
      })
    ).not.toThrow();
  });

  it("requires previous COMPLETE", () => {
    expect(() =>
      assertAttestationOrder({
        order: 3,
        authority: "MEA",
        previousStatus: "PENDING",
        previousAuthority: "STATE_HRD",
      })
    ).toThrow(StageLockedError);
  });

  it("allows the next step after COMPLETE", () => {
    expect(() =>
      assertAttestationOrder({
        order: 2,
        authority: "STATE_HRD",
        previousStatus: "COMPLETE",
        previousAuthority: "NOTARY",
      })
    ).not.toThrow();
  });
});
