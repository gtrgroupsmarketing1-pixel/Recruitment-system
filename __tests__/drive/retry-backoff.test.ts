import { describe, it, expect } from "vitest";
import { nextAttemptAt } from "@/core/drive/folder-path";

describe("retry backoff", () => {
  const now = 1_700_000_000_000;
  it("schedules by attempt and stops at 5", () => {
    expect(nextAttemptAt(0, now)?.getTime()).toBe(now);
    expect(nextAttemptAt(1, now)?.getTime()).toBe(now + 5 * 60_000);
    expect(nextAttemptAt(2, now)?.getTime()).toBe(now + 30 * 60_000);
    expect(nextAttemptAt(3, now)?.getTime()).toBe(now + 2 * 60 * 60_000);
    expect(nextAttemptAt(4, now)?.getTime()).toBe(now + 12 * 60 * 60_000);
    expect(nextAttemptAt(5, now)).toBeNull();
  });
});
