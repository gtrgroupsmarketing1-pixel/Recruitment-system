import type { FreeBusySlot, TimeWindow } from "./calendar.client";

export type Slot = { startsAt: Date; endsAt: Date };

export function computeCandidateSlots(
  busy: FreeBusySlot[],
  window: TimeWindow,
  options: {
    durationMinutes: number;
    workingHours: { startHour: number; endHour: number };
    excludeWeekends: boolean;
  }
): Slot[] {
  const slots: Slot[] = [];
  const durationMs = options.durationMinutes * 60_000;
  const dayStart = new Date(window.start);
  dayStart.setUTCHours(0, 0, 0, 0);

  for (
    let day = new Date(dayStart);
    day.getTime() < window.end.getTime();
    day = new Date(day.getTime() + 86_400_000)
  ) {
    const dow = day.getUTCDay();
    if (options.excludeWeekends && (dow === 0 || dow === 6)) continue;

    for (
      let hour = options.workingHours.startHour;
      hour < options.workingHours.endHour;
      hour++
    ) {
      for (let minute = 0; minute < 60; minute += options.durationMinutes) {
        const startsAt = new Date(day);
        startsAt.setUTCHours(hour, minute, 0, 0);
        const endsAt = new Date(startsAt.getTime() + durationMs);
        if (endsAt.getUTCHours() > options.workingHours.endHour) continue;
        if (endsAt.getUTCHours() === options.workingHours.endHour && endsAt.getUTCMinutes() > 0)
          continue;
        if (startsAt < window.start || endsAt > window.end) continue;

        const overlaps = busy.some(
          (b) => !b.isFree && startsAt < b.end && endsAt > b.start
        );
        if (!overlaps) slots.push({ startsAt, endsAt });
      }
    }
  }
  return slots;
}
