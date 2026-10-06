import { describe, expect, it } from "vitest";
import { PIPELINE_ORDER } from "@/modules/application/application.status-order";
import {
  STATUS,
  type Status,
} from "@/modules/application/application.state-machine";

const EXIT: readonly Status[] = [
  STATUS.REJECTED,
  STATUS.ON_HOLD,
  STATUS.MEDICAL_UNFIT,
  STATUS.VISA_REFUSED,
  STATUS.ABSCONDED,
];

describe("PIPELINE_ORDER", () => {
  it("has exactly 16 entries", () => {
    expect(PIPELINE_ORDER).toHaveLength(16);
  });

  it("every entry is a valid Status", () => {
    const all = new Set(Object.values(STATUS));
    for (const status of PIPELINE_ORDER) {
      expect(all.has(status)).toBe(true);
    }
  });

  it("CLIENT_INTERVIEWED comes after SHORTLISTED", () => {
    expect(PIPELINE_ORDER.indexOf(STATUS.CLIENT_INTERVIEWED)).toBeGreaterThan(
      PIPELINE_ORDER.indexOf(STATUS.SHORTLISTED)
    );
  });

  it("MOBILIZED comes before PROBATION", () => {
    expect(PIPELINE_ORDER.indexOf(STATUS.MOBILIZED)).toBeLessThan(
      PIPELINE_ORDER.indexOf(STATUS.PROBATION)
    );
  });

  it("contains no exit states", () => {
    for (const status of EXIT) {
      expect(PIPELINE_ORDER.includes(status)).toBe(false);
    }
  });
});
