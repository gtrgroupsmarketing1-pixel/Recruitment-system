import { describe, expect, it } from "vitest";
import { buildReqCode, padSeq, reqCodePrefix } from "@/modules/requisition/requisition.id";

describe("buildReqCode", () => {
  it("produces EMR-AE-BC-202610-014 format", () => {
    expect(
      buildReqCode({
        clientCode: "emr",
        countryCode: "ae",
        roleCategoryCode: "bc",
        yyyymm: "202610",
        seq: 14,
      })
    ).toBe("EMR-AE-BC-202610-014");
  });

  it("zero-pads sequence", () => {
    expect(padSeq(1)).toBe("001");
    expect(padSeq(42)).toBe("042");
    expect(padSeq(999)).toBe("999");
  });

  it("month boundary changes prefix so sequence is independent", () => {
    const oct = reqCodePrefix({
      clientCode: "EMR",
      countryCode: "AE",
      roleCategoryCode: "BC",
      yyyymm: "202610",
    });
    const nov = reqCodePrefix({
      clientCode: "EMR",
      countryCode: "AE",
      roleCategoryCode: "BC",
      yyyymm: "202611",
    });
    expect(oct).not.toBe(nov);
    expect(buildReqCode({ clientCode: "EMR", countryCode: "AE", roleCategoryCode: "BC", yyyymm: "202611", seq: 1 })).toBe(
      "EMR-AE-BC-202611-001"
    );
  });

  it("different client has an independent prefix", () => {
    const a = reqCodePrefix({
      clientCode: "EMR",
      countryCode: "AE",
      roleCategoryCode: "BC",
      yyyymm: "202610",
    });
    const b = reqCodePrefix({
      clientCode: "ACME",
      countryCode: "AE",
      roleCategoryCode: "BC",
      yyyymm: "202610",
    });
    expect(a).not.toBe(b);
  });
});
