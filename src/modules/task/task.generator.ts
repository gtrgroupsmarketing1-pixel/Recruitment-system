import type { Status } from "@/modules/application/application.state-machine";
import { EXIT_STATES, STATUS } from "@/modules/application/application.state-machine";
import type { TaskPriority, TaskType } from "@prisma/client";

export type TaskSpec = {
  type: TaskType;
  title: string;
  description: string | null;
  dueInDays: number;
  priority: TaskPriority;
};

type Edge = `${Status}->${Status}`;

const FORWARD: Partial<Record<Edge, TaskSpec>> = {
  [`${STATUS.SCREENED}->${STATUS.SHORTLISTED}`]: {
    type: "CLIENT_UPDATE",
    title: "Send shortlist to client",
    description: null,
    dueInDays: 1,
    priority: "HIGH",
  },
  [`${STATUS.SHORTLISTED}->${STATUS.CLIENT_INTERVIEWED}`]: {
    type: "SCHEDULE_INTERVIEW",
    title: "Schedule client interview",
    description: null,
    dueInDays: 2,
    priority: "HIGH",
  },
  [`${STATUS.CLIENT_INTERVIEWED}->${STATUS.SELECTED}`]: {
    type: "COMPLIANCE_INITIATE",
    title: "Initiate compliance checklist",
    description: null,
    dueInDays: 1,
    priority: "HIGH",
  },
  [`${STATUS.SELECTED}->${STATUS.MEDICAL_BOOKED}`]: {
    type: "FOLLOW_UP_MEDICAL",
    title: "Confirm medical appointment",
    description: null,
    dueInDays: 2,
    priority: "HIGH",
  },
  [`${STATUS.MEDICAL_BOOKED}->${STATUS.MEDICAL_CLEARED}`]: {
    type: "FOLLOW_UP_MEDICAL",
    title: "Collect medical certificate",
    description: null,
    dueInDays: 3,
    priority: "MEDIUM",
  },
  [`${STATUS.MEDICAL_CLEARED}->${STATUS.DOCUMENTS_IN_ATTESTATION}`]: {
    type: "FOLLOW_UP_DOCUMENTS",
    title: "Submit documents for attestation",
    description: null,
    dueInDays: 3,
    priority: "MEDIUM",
  },
  [`${STATUS.DOCUMENTS_IN_ATTESTATION}->${STATUS.ATTESTATION_CLEARED}`]: {
    type: "FOLLOW_UP_ATTESTATION",
    title: "Track attestation progress",
    description: null,
    dueInDays: 5,
    priority: "MEDIUM",
  },
  [`${STATUS.ATTESTATION_CLEARED}->${STATUS.VISA_APPLIED}`]: {
    type: "FOLLOW_UP_VISA",
    title: "Track visa application",
    description: null,
    dueInDays: 5,
    priority: "HIGH",
  },
  [`${STATUS.VISA_APPLIED}->${STATUS.VISA_STAMPED}`]: {
    type: "FOLLOW_UP_VISA",
    title: "Collect stamped passport",
    description: null,
    dueInDays: 3,
    priority: "HIGH",
  },
  [`${STATUS.VISA_STAMPED}->${STATUS.TICKET_BOOKED}`]: {
    type: "TRAVEL_BOOKING",
    title: "Book flight ticket",
    description: null,
    dueInDays: 2,
    priority: "HIGH",
  },
  [`${STATUS.TICKET_BOOKED}->${STATUS.TRAVELED}`]: {
    type: "ARRIVAL_CONFIRM",
    title: "Confirm arrival with candidate",
    description: null,
    dueInDays: 1,
    priority: "HIGH",
  },
  [`${STATUS.TRAVELED}->${STATUS.MOBILIZED}`]: {
    type: "ARRIVAL_CONFIRM",
    title: "Confirm on-site check-in with client",
    description: null,
    dueInDays: 2,
    priority: "HIGH",
  },
  [`${STATUS.MOBILIZED}->${STATUS.PROBATION}`]: {
    type: "PROBATION_CHECK_IN",
    title: "Schedule 30-day probation check-in",
    description: null,
    dueInDays: 30,
    priority: "LOW",
  },
  [`${STATUS.PROBATION}->${STATUS.CONFIRMED}`]: {
    type: "PROBATION_CHECK_IN",
    title: "Close file, final billing",
    description: null,
    dueInDays: 5,
    priority: "MEDIUM",
  },
};

/**
 * Pure task generator. No DB, no Date.now(), no I/O.
 */
export function generateTaskSpec(
  from: Status,
  to: Status,
  reason?: string
): TaskSpec | null {
  if (EXIT_STATES.includes(to) && !EXIT_STATES.includes(from) && from !== STATUS.CONFIRMED) {
    return {
      type: "EXIT_RECORD",
      title: reason
        ? `Record exit reason: ${reason}`
        : "Record exit reason",
      description: reason ?? null,
      dueInDays: 0,
      priority: "URGENT",
    };
  }
  const key = `${from}->${to}` as Edge;
  return FORWARD[key] ?? null;
}
