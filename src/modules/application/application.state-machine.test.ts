import { describe, it, expect } from "vitest";
import {
  STATUS,
  transition,
  IllegalTransitionError,
  isTerminal,
  ALL_STATUSES,
} from "./application.state-machine";

describe("application.state-machine", () => {
  describe("happy path India→UAE blue-collar", () => {
    const happyPath: (typeof STATUS)[keyof typeof STATUS][] = [
      STATUS.SOURCED,
      STATUS.SCREENED,
      STATUS.SHORTLISTED,
      STATUS.CLIENT_INTERVIEWED,
      STATUS.SELECTED,
      STATUS.MEDICAL_BOOKED,
      STATUS.MEDICAL_CLEARED,
      STATUS.DOCUMENTS_IN_ATTESTATION,
      STATUS.ATTESTATION_CLEARED,
      STATUS.VISA_APPLIED,
      STATUS.VISA_STAMPED,
      STATUS.TICKET_BOOKED,
      STATUS.TRAVELED,
      STATUS.MOBILIZED,
      STATUS.PROBATION,
      STATUS.CONFIRMED,
    ];

    it("allows the full happy path", () => {
      for (let i = 0; i < happyPath.length - 1; i++) {
        expect(() => transition(happyPath[i], happyPath[i + 1])).not.toThrow();
      }
    });
  });

  describe("exit states", () => {
    it("allows REJECTED from any active state", () => {
      const active = ALL_STATUSES.filter(
        (s) => !isTerminal(s) || s === STATUS.CONFIRMED
      );
      for (const from of active) {
        if (from === STATUS.CONFIRMED) continue;
        expect(() => transition(from, STATUS.REJECTED)).not.toThrow();
      }
    });

    it("allows MEDICAL_UNFIT only after MEDICAL_BOOKED (via exit rule)", () => {
      expect(() =>
        transition(STATUS.MEDICAL_BOOKED, STATUS.MEDICAL_UNFIT)
      ).not.toThrow();
    });
  });

  describe("illegal transitions", () => {
    it("rejects skipping stages", () => {
      expect(() =>
        transition(STATUS.SHORTLISTED, STATUS.SELECTED)
      ).toThrow(IllegalTransitionError);
      expect(() =>
        transition(STATUS.MEDICAL_CLEARED, STATUS.VISA_STAMPED)
      ).toThrow(IllegalTransitionError);
    });

    it("rejects moving from terminal states", () => {
      expect(() => transition(STATUS.CONFIRMED, STATUS.MOBILIZED)).toThrow(
        IllegalTransitionError
      );
      expect(() => transition(STATUS.REJECTED, STATUS.SOURCED)).toThrow(
        IllegalTransitionError
      );
    });

    it("rejects self-transition", () => {
      expect(() => transition(STATUS.SELECTED, STATUS.SELECTED)).toThrow(
        IllegalTransitionError
      );
    });
  });

  describe("isTerminal", () => {
    it("marks success and exits as terminal", () => {
      expect(isTerminal(STATUS.CONFIRMED)).toBe(true);
      expect(isTerminal(STATUS.REJECTED)).toBe(true);
      expect(isTerminal(STATUS.ABSCONDED)).toBe(true);
      expect(isTerminal(STATUS.SELECTED)).toBe(false);
      expect(isTerminal(STATUS.MOBILIZED)).toBe(false);
    });
  });
});
