import { describe, expect, it } from "vitest";

function nextRetryDelay(current: number): number {
  return Math.min(current * 2, 30_000);
}

describe("realtime hook transitions", () => {
  it("backs off and caps retry delay", () => {
    expect(nextRetryDelay(1000)).toBe(2000);
    expect(nextRetryDelay(16_000)).toBe(30_000);
    expect(nextRetryDelay(30_000)).toBe(30_000);
  });
});
