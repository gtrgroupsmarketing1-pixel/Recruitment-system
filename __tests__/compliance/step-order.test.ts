import { describe, it, expect } from "vitest";
import { validateStepGraph } from "@/modules/compliance/compliance.graph";
import { ValidationError } from "@/lib/errors";

describe("step graph", () => {
  it("accepts a backward chain", () => {
    expect(() =>
      validateStepGraph([
        { stepOrder: 1, name: "a", dependsOnStepOrder: null },
        { stepOrder: 2, name: "b", dependsOnStepOrder: 1 },
      ])
    ).not.toThrow();
  });

  it("rejects duplicate stepOrder", () => {
    expect(() =>
      validateStepGraph([
        { stepOrder: 1, name: "a", dependsOnStepOrder: null },
        { stepOrder: 1, name: "b", dependsOnStepOrder: null },
      ])
    ).toThrow(ValidationError);
  });

  it("rejects self dependency", () => {
    expect(() =>
      validateStepGraph([{ stepOrder: 1, name: "a", dependsOnStepOrder: 1 }])
    ).toThrow(ValidationError);
  });

  it("rejects forward dependency", () => {
    expect(() =>
      validateStepGraph([
        { stepOrder: 1, name: "a", dependsOnStepOrder: 2 },
        { stepOrder: 2, name: "b", dependsOnStepOrder: null },
      ])
    ).toThrow(ValidationError);
  });
});
