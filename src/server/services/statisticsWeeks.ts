import { countMemorisedInWeek, weekBounds } from "@/domain/week";
import type { WeekOption } from "./getStatistics";

/**
 * The selected week's figure and bounds (DEC-54's two options, `current` or `previous`), plus the
 * *true* previous week's count relative to `now` — always the same one, whichever chip is active, so
 * the hint's "W poprzednim tygodniu: N" never needs a third week computed.
 */
export function pickWeek(firstKnownAtValues: readonly (Date | null)[], week: WeekOption, now: Date) {
  const currentBounds = weekBounds(now);
  const previousProbe = new Date(currentBounds.start.getTime() - 1);
  const previousBounds = weekBounds(previousProbe);
  const currentCount = countMemorisedInWeek(firstKnownAtValues, now);
  const previousCount = countMemorisedInWeek(firstKnownAtValues, previousProbe);
  const selected =
    week === "previous" ? { bounds: previousBounds, count: previousCount } : { bounds: currentBounds, count: currentCount };

  return {
    memorised: selected.count,
    weekStart: selected.bounds.start,
    weekEnd: selected.bounds.end,
    previousWeek: previousCount,
  };
}
