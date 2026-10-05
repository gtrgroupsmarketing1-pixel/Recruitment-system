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

/** Legal forward transitions. Exit states are allowed from any non-exit state. */
const TRANSITIONS: Record<Status, readonly Status[]> = {
  [STATUS.SOURCED]: [STATUS.SCREENED, STATUS.REJECTED, STATUS.ON_HOLD],
  [STATUS.SCREENED]: [STATUS.SHORTLISTED, STATUS.REJECTED, STATUS.ON_HOLD],
  [STATUS.SHORTLISTED]: [
    STATUS.CLIENT_INTERVIEWED,
    STATUS.SELECTED,
    STATUS.REJECTED,
    STATUS.ON_HOLD,
  ],
  [STATUS.CLIENT_INTERVIEWED]: [
    STATUS.SELECTED,
    STATUS.REJECTED,
    STATUS.ON_HOLD,
  ],
  [STATUS.SELECTED]: [
    STATUS.MEDICAL_BOOKED,
    STATUS.REJECTED,
    STATUS.ON_HOLD,
  ],
  [STATUS.MEDICAL_BOOKED]: [
    STATUS.MEDICAL_CLEARED,
    STATUS.MEDICAL_UNFIT,
    STATUS.ON_HOLD,
  ],
  [STATUS.MEDICAL_CLEARED]: [
    STATUS.DOCUMENTS_IN_ATTESTATION,
    STATUS.REJECTED,
    STATUS.ON_HOLD,
  ],
  [STATUS.DOCUMENTS_IN_ATTESTATION]: [
    STATUS.ATTESTATION_CLEARED,
    STATUS.REJECTED,
    STATUS.ON_HOLD,
  ],
  [STATUS.ATTESTATION_CLEARED]: [
    STATUS.VISA_APPLIED,
    STATUS.REJECTED,
    STATUS.ON_HOLD,
  ],
  [STATUS.VISA_APPLIED]: [
    STATUS.VISA_STAMPED,
    STATUS.VISA_REFUSED,
    STATUS.ON_HOLD,
  ],
  [STATUS.VISA_STAMPED]: [
    STATUS.TICKET_BOOKED,
    STATUS.REJECTED,
    STATUS.ON_HOLD,
  ],
  [STATUS.TICKET_BOOKED]: [
    STATUS.TRAVELED,
    STATUS.REJECTED,
    STATUS.ON_HOLD,
  ],
  [STATUS.TRAVELED]: [STATUS.MOBILIZED, STATUS.ABSCONDED, STATUS.ON_HOLD],
  [STATUS.MOBILIZED]: [STATUS.PROBATION, STATUS.ABSCONDED, STATUS.ON_HOLD],
  [STATUS.PROBATION]: [STATUS.CONFIRMED, STATUS.ABSCONDED, STATUS.ON_HOLD],
  [STATUS.CONFIRMED]: [], // terminal success
  // Exit states have no outgoing transitions
  [STATUS.REJECTED]: [],
  [STATUS.ON_HOLD]: [], // can be resumed via explicit business rule later
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

/** Returns true if the status is a terminal success or exit. */
export function isTerminal(status: Status): boolean {
  return (
    status === STATUS.CONFIRMED ||
    EXIT_STATES.includes(status)
  );
}

/** All statuses for exhaustive testing / UI. */
export const ALL_STATUSES = Object.values(STATUS);
