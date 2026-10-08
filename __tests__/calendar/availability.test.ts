import { describe, it, expect } from "vitest";
import { computeCandidateSlots } from "@/core/calendar/availability";

describe("computeCandidateSlots", () => {
  const window = {
    start: new Date("2026-10-05T00:00:00.000Z"), // Monday
    end: new Date("2026-10-06T00:00:00.000Z"),
  };

  it("returns slots within working hours when busy is empty", () => {
    const slots = computeCandidateSlots([], window, {
      durationMinutes: 30,
      workingHours: { startHour: 9, endHour: 18 },
      excludeWeekends: true,
    });
    expect(slots.length).toBe(18);
    expect(slots[0].startsAt.getUTCHours()).toBe(9);
  });

  it("excludes overlapping busy blocks", () => {
    const busy = [
      {
        start: new Date("2026-10-05T09:00:00.000Z"),
        end: new Date("2026-10-05T10:00:00.000Z"),
        isFree: false,
      },
    ];
    const slots = computeCandidateSlots(busy, window, {
      durationMinutes: 30,
      workingHours: { startHour: 9, endHour: 12 },
      excludeWeekends: true,
    });
    expect(slots.every((s) => s.startsAt >= busy[0].end || s.endsAt <= busy[0].start)).toBe(
      true
    );
    expect(slots.length).toBeLessThan(6);
  });

  it("excludes weekends when option set", () => {
    const weekend = {
      start: new Date("2026-10-10T00:00:00.000Z"), // Saturday
      end: new Date("2026-10-12T00:00:00.000Z"),
    };
    const slots = computeCandidateSlots([], weekend, {
      durationMinutes: 60,
      workingHours: { startHour: 9, endHour: 17 },
      excludeWeekends: true,
    });
    expect(slots.length).toBe(0);
  });
});
