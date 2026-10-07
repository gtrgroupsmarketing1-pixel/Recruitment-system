import { describe, it, expect } from "vitest";
import { generateTaskSpec } from "@/modules/task/task.generator";
import {
  STATUS,
  EXIT_STATES,
  ALL_STATUSES,
} from "@/modules/application/application.state-machine";

describe("generateTaskSpec", () => {
  it("maps SCREENED → SHORTLISTED", () => {
    const spec = generateTaskSpec(STATUS.SCREENED, STATUS.SHORTLISTED);
    expect(spec).toMatchObject({
      type: "CLIENT_UPDATE",
      title: "Send shortlist to client",
      dueInDays: 1,
      priority: "HIGH",
    });
  });

  it("maps SHORTLISTED → CLIENT_INTERVIEWED", () => {
    expect(
      generateTaskSpec(STATUS.SHORTLISTED, STATUS.CLIENT_INTERVIEWED)?.type
    ).toBe("SCHEDULE_INTERVIEW");
  });

  it("maps CLIENT_INTERVIEWED → SELECTED", () => {
    expect(
      generateTaskSpec(STATUS.CLIENT_INTERVIEWED, STATUS.SELECTED)?.type
    ).toBe("COMPLIANCE_INITIATE");
  });

  it("maps SELECTED → MEDICAL_BOOKED", () => {
    expect(generateTaskSpec(STATUS.SELECTED, STATUS.MEDICAL_BOOKED)?.dueInDays).toBe(2);
  });

  it("maps MEDICAL_BOOKED → MEDICAL_CLEARED", () => {
    expect(generateTaskSpec(STATUS.MEDICAL_BOOKED, STATUS.MEDICAL_CLEARED)?.priority).toBe("MEDIUM");
  });

  it("maps MEDICAL_CLEARED → DOCUMENTS_IN_ATTESTATION", () => {
    expect(
      generateTaskSpec(STATUS.MEDICAL_CLEARED, STATUS.DOCUMENTS_IN_ATTESTATION)?.type
    ).toBe("FOLLOW_UP_DOCUMENTS");
  });

  it("maps DOCUMENTS_IN_ATTESTATION → ATTESTATION_CLEARED", () => {
    expect(
      generateTaskSpec(STATUS.DOCUMENTS_IN_ATTESTATION, STATUS.ATTESTATION_CLEARED)?.dueInDays
    ).toBe(5);
  });

  it("maps ATTESTATION_CLEARED → VISA_APPLIED", () => {
    expect(
      generateTaskSpec(STATUS.ATTESTATION_CLEARED, STATUS.VISA_APPLIED)?.type
    ).toBe("FOLLOW_UP_VISA");
  });

  it("maps VISA_APPLIED → VISA_STAMPED", () => {
    expect(generateTaskSpec(STATUS.VISA_APPLIED, STATUS.VISA_STAMPED)?.title).toContain("stamped");
  });

  it("maps VISA_STAMPED → TICKET_BOOKED", () => {
    expect(generateTaskSpec(STATUS.VISA_STAMPED, STATUS.TICKET_BOOKED)?.type).toBe("TRAVEL_BOOKING");
  });

  it("maps TICKET_BOOKED → TRAVELED", () => {
    expect(generateTaskSpec(STATUS.TICKET_BOOKED, STATUS.TRAVELED)?.dueInDays).toBe(1);
  });

  it("maps TRAVELED → MOBILIZED", () => {
    expect(generateTaskSpec(STATUS.TRAVELED, STATUS.MOBILIZED)?.type).toBe("ARRIVAL_CONFIRM");
  });

  it("maps MOBILIZED → PROBATION", () => {
    expect(generateTaskSpec(STATUS.MOBILIZED, STATUS.PROBATION)?.dueInDays).toBe(30);
  });

  it("maps PROBATION → CONFIRMED", () => {
    expect(generateTaskSpec(STATUS.PROBATION, STATUS.CONFIRMED)?.title).toContain("billing");
  });

  it("unmapped forward returns null", () => {
    expect(generateTaskSpec(STATUS.SOURCED, STATUS.SCREENED)).toBeNull();
  });

  it("exit from active is EXIT_RECORD URGENT", () => {
    for (const from of ALL_STATUSES.filter(
      (s) => !EXIT_STATES.includes(s) && s !== STATUS.CONFIRMED
    )) {
      for (const exit of EXIT_STATES) {
        const spec = generateTaskSpec(from, exit);
        expect(spec?.type).toBe("EXIT_RECORD");
        expect(spec?.priority).toBe("URGENT");
        expect(spec?.dueInDays).toBe(0);
      }
    }
  });

  it("exit without reason has null description", () => {
    const spec = generateTaskSpec(STATUS.SELECTED, STATUS.REJECTED);
    expect(spec?.description).toBeNull();
  });

  it("exit with reason interpolates title", () => {
    const spec = generateTaskSpec(STATUS.SELECTED, STATUS.REJECTED, "no-show");
    expect(spec?.title).toContain("no-show");
    expect(spec?.description).toBe("no-show");
  });

  it("CONFIRMED → anything returns null (not exit generator)", () => {
    expect(generateTaskSpec(STATUS.CONFIRMED, STATUS.REJECTED)).toBeNull();
  });
});
