import { describe, it, expect } from "vitest";
import {
  STATUS,
  TRANSITIONS,
  EXIT_STATES,
  TERMINAL_STATES,
  ALL_STATUSES,
  transition,
  nextStates,
  isExitState,
  isTerminal,
  type Status,
  IllegalTransitionError,
} from "./application.state-machine";

const ACTIVE_STATUSES = ALL_STATUSES.filter(
  (s) => !EXIT_STATES.includes(s) && s !== STATUS.CONFIRMED
);

describe("state machine", () => {
  it("has exactly 21 statuses", () => {
    expect(ALL_STATUSES).toHaveLength(21);
  });

  it("has 5 exit states", () => {
    expect(EXIT_STATES).toHaveLength(5);
  });

  it("has 6 terminal states (5 exits + CONFIRMED)", () => {
    expect(TERMINAL_STATES).toHaveLength(6);
  });

  describe("legal transitions", () => {
    for (const from of ACTIVE_STATUSES) {
      for (const to of TRANSITIONS[from]) {
        it(`${from} → ${to} succeeds`, () => {
          expect(() => transition(from, to)).not.toThrow();
        });
      }
    }
  });

  describe("illegal transitions", () => {
    for (const from of ACTIVE_STATUSES) {
      const legal = new Set<Status>([...TRANSITIONS[from], ...EXIT_STATES]);
      const illegal = ACTIVE_STATUSES.filter((s) => !legal.has(s));
      for (const to of illegal) {
        it(`${from} → ${to} throws`, () => {
          expect(() => transition(from, to)).toThrow(IllegalTransitionError);
        });
      }
    }
  });

  describe("every active state reaches every exit", () => {
    for (const from of ACTIVE_STATUSES) {
      for (const exit of EXIT_STATES) {
        it(`${from} → ${exit}`, () => {
          expect(() => transition(from, exit)).not.toThrow();
        });
      }
    }
  });

  describe("exit states have no outgoing transitions", () => {
    for (const t of EXIT_STATES) {
      it(`${t} → any throws`, () => {
        for (const to of ALL_STATUSES) {
          expect(() => transition(t, to)).toThrow(IllegalTransitionError);
        }
      });
    }
  });

  describe("CONFIRMED rejects non-exit targets", () => {
    for (const to of ACTIVE_STATUSES) {
      it(`CONFIRMED → ${to} throws`, () => {
        expect(() => transition(STATUS.CONFIRMED, to)).toThrow(
          IllegalTransitionError
        );
      });
    }
  });

  describe("self-transitions throw", () => {
    for (const s of ACTIVE_STATUSES) {
      it(`${s} → ${s} throws`, () => {
        expect(() => transition(s, s)).toThrow(IllegalTransitionError);
      });
    }
  });

  describe("nextStates()", () => {
    for (const s of ACTIVE_STATUSES) {
      it(`${s} returns forward edges + all exits`, () => {
        const result = [...nextStates(s)].sort();
        const expected = [...TRANSITIONS[s], ...EXIT_STATES].sort();
        expect(result).toEqual(expected);
      });
    }
    for (const t of TERMINAL_STATES) {
      it(`${t} returns empty`, () => {
        expect(nextStates(t)).toEqual([]);
      });
    }
  });

  describe("isExitState / isTerminal", () => {
    for (const s of ALL_STATUSES) {
      it(`${s} isExitState=${EXIT_STATES.includes(s)}`, () => {
        expect(isExitState(s)).toBe(EXIT_STATES.includes(s));
      });
      it(`${s} isTerminal=${TERMINAL_STATES.includes(s)}`, () => {
        expect(isTerminal(s)).toBe(TERMINAL_STATES.includes(s));
      });
    }
  });
});
