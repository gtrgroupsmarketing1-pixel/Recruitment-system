/**
 * Pure state machine for CandidateApplication.status.
 * THE only place that defines legal transitions.
 * No I/O, no side-effects. Easy to unit-test exhaustively.
 */

export const STATUS = {
  SOURCED: "SOURCED",
  SCREENED: "SCREENED",
  SHORTLISTED: "SHORTLISTED",
  CLIENT_INTERVIEWED: "CLIENT_INTERVIEWED",
  SELECTED: "SELECTED",
  MEDICAL_BOOKED: "MEDICAL_BOOKED",
  MEDICAL_CLEARED: "MEDICAL_CLEARED",
  DOCUMENTS_IN_ATTESTATION: "DOCUMENTS_IN_ATTESTATION",
  ATTESTATION_CLEARED: "ATTESTATION_CLEARED",
  VISA_APPLIED: "VISA_APPLIED",
  VISA_STAMPED: "VISA_STAMPED",
  TICKET_BOOKED: "TICKET_BOOKED",
  TRAVELED: "TRAVELED",
  MOBILIZED: "MOBILIZED",
  PROBATION: "PROBATION",
  CONFIRMED: "CONFIRMED",
  // Exit / branch states
  REJECTED: "REJECTED",
  ON_HOLD: "ON_HOLD",
  MEDICAL_UNFIT: "MEDICAL_UNFIT",
  VISA_REFUSED: "VISA_REFUSED",
  ABSCONDED: "ABSCONDED",
} as const;

export type Status = (typeof STATUS)[keyof typeof STATUS];

const EXIT_STATES: readonly Status[] = [
  STATUS.REJECTED,
  STATUS.ON_HOLD,
  STATUS.MEDICAL_UNFIT,
  STATUS.VISA_REFUSED,
  STATUS.ABSCONDED,
] as const;

/** Legal forward-progress edges only. Exit states are appended by nextStates(). */
const TRANSITIONS: Record<Status, readonly Status[]> = {
  [STATUS.SOURCED]: [STATUS.SCREENED],
  [STATUS.SCREENED]: [STATUS.SHORTLISTED],
  [STATUS.SHORTLISTED]: [STATUS.CLIENT_INTERVIEWED],
  [STATUS.CLIENT_INTERVIEWED]: [STATUS.SELECTED],
  [STATUS.SELECTED]: [STATUS.MEDICAL_BOOKED],
  [STATUS.MEDICAL_BOOKED]: [STATUS.MEDICAL_CLEARED],
  [STATUS.MEDICAL_CLEARED]: [STATUS.DOCUMENTS_IN_ATTESTATION],
  [STATUS.DOCUMENTS_IN_ATTESTATION]: [STATUS.ATTESTATION_CLEARED],
  [STATUS.ATTESTATION_CLEARED]: [STATUS.VISA_APPLIED],
  [STATUS.VISA_APPLIED]: [STATUS.VISA_STAMPED],
  [STATUS.VISA_STAMPED]: [STATUS.TICKET_BOOKED],
  [STATUS.TICKET_BOOKED]: [STATUS.TRAVELED],
  [STATUS.TRAVELED]: [STATUS.MOBILIZED],
  [STATUS.MOBILIZED]: [STATUS.PROBATION],
  [STATUS.PROBATION]: [STATUS.CONFIRMED],
  [STATUS.CONFIRMED]: [],
  [STATUS.REJECTED]: [],
  [STATUS.ON_HOLD]: [],
  [STATUS.MEDICAL_UNFIT]: [],
  [STATUS.VISA_REFUSED]: [],
  [STATUS.ABSCONDED]: [],
};

export class IllegalTransitionError extends Error {
  constructor(
    public readonly from: Status,
    public readonly to: Status
  ) {
    super(`Illegal status transition: ${from} → ${to}`);
    this.name = "IllegalTransitionError";
  }
}

/**
 * Validate and allow a transition.
 * Throws IllegalTransitionError if the move is not permitted.
 * Exit states are reachable from any active state.
 */
export function transition(from: Status, to: Status): void {
  if (from === to) {
    throw new IllegalTransitionError(from, to);
  }

  // Any non-exit → exit is always allowed
  if (EXIT_STATES.includes(to) && !EXIT_STATES.includes(from)) {
    return;
  }

  const allowed = TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) {
    throw new IllegalTransitionError(from, to);
  }
}

/**
 * Post-deployment statuses that count as requisition fulfillment.
 * Additive constant — does not change TRANSITIONS.
 */
export const FILLED_STATUSES = [
  STATUS.MOBILIZED,
  STATUS.PROBATION,
  STATUS.CONFIRMED,
] as const;
export const ALL_STATUSES = Object.values(STATUS);
export function isTerminal(status: Status): boolean {
  return (
    status === STATUS.CONFIRMED ||
    EXIT_STATES.includes(status)
  );
}

/**
 * UI options: forward edges plus every exit, uniformly.
 * Exits are not stored on TRANSITIONS, so maps cannot drift.
 */
export function nextStates(from: Status): Status[] {
  if (EXIT_STATES.includes(from) || from === STATUS.CONFIRMED) {
    return [];
  }
  return [...(TRANSITIONS[from] ?? []), ...EXIT_STATES];
}
