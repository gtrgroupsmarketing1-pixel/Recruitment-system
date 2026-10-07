import { describe, it, expect } from "vitest";
import {
  TEMPLATES,
  renderTemplate,
  field,
  listTemplateKeys,
} from "@/core/notifications/templates";

describe("notification templates", () => {
  it("each template renders with a valid context", () => {
    const keys = listTemplateKeys();
    expect(keys.length).toBeGreaterThanOrEqual(3);
    for (const key of keys) {
      const result = renderTemplate(key, {
        candidateName: "Ravi",
        status: "SELECTED",
        requisitionCode: "ACME-UAE-BLU-202610-001",
        documentLabel: "Passport",
        expiresOn: "2026-12-01",
        daysRemaining: 30,
        taskTitle: "Follow up medical",
        dueDate: "2026-10-01",
        refType: "CandidateApplication",
        refId: "app_1",
      });
      expect(result.body.length).toBeGreaterThan(0);
      expect(result.body).not.toContain("undefined");
      expect(result.channel).toBeTruthy();
    }
  });

  it("missing context fields render as empty string not undefined", () => {
    const result = renderTemplate("candidate.status_changed", {});
    expect(result.body).not.toContain("undefined");
    expect(result.body).toContain("Hi ,");
  });

  it("template with subject renders subject; without, subject is null", () => {
    const withSubject = renderTemplate("document.expiring", {
      documentLabel: "Visa",
    });
    expect(withSubject.subject).toContain("Visa");

    const noSubject = renderTemplate("candidate.status_changed", {
      candidateName: "A",
      status: "SOURCED",
      requisitionCode: "R",
    });
    expect(noSubject.subject).toBeNull();
  });

  it("field helper coerces null and undefined", () => {
    expect(field({ a: null }, "a")).toBe("");
    expect(field({ a: undefined }, "a")).toBe("");
    expect(field({ a: 3 }, "a")).toBe("3");
    expect(field({}, "missing", "x")).toBe("x");
  });

  it("TEMPLATES keys match expected event types", () => {
    expect(TEMPLATES["candidate.status_changed"]).toBeDefined();
    expect(TEMPLATES["document.expiring"]).toBeDefined();
    expect(TEMPLATES["task.overdue"]).toBeDefined();
  });
});
