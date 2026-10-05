import type { Mark, MarkOutcome, ProgressRecord } from "./types";

/** DEC-05: a card is hidden for seven days once it reaches five consecutive **Umiem**. */
export const HIDE_DAYS = 7;
export const KNOW_THRESHOLD = 5;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

/**
 * Applies one marking to a card's progress — DEC-03, DEC-05, DEC-14.
 *
 * **Do powtórki** and **Nie umiem** reset the Umiem streak to zero and clear any hide (DEC-03,
 * DEC-09), reporting what the counter reset from. The fifth consecutive **Umiem** sets
 * `hiddenUntil` to seven days from `now` (DEC-05); a sixth consecutive **Umiem** — reachable only
 * through a reinforcement slot on a card already hidden (DEC-09) — does not move `hiddenUntil`
 * again, since DEC-05 fixes it at the moment of *the fifth*.
 *
 * `alreadyCountedThisSession` is the caller's record of whether this card already raised the
 * Umiem counter once this session, so a second **Umiem** on the same card does not raise it twice
 * (DEC-14) — it still returns a `MarkOutcome` so the caller can still write a Review Event for the
 * tap, just with `countedTowardsKnow: false`.
 */
export function applyMark(
  current: ProgressRecord,
  mark: Mark,
  now: Date,
  alreadyCountedThisSession: boolean,
): MarkOutcome {
  if (mark !== "KNOW") {
    const resetFrom = current.knowCount > 0 ? current.knowCount : null;
    return {
      mark,
      knowCount: 0,
      hiddenUntil: null,
      firstKnownAt: current.firstKnownAt,
      resetFrom,
      countedTowardsKnow: false,
    };
  }

  if (alreadyCountedThisSession) {
    return {
      mark: "KNOW",
      knowCount: current.knowCount,
      hiddenUntil: current.hiddenUntil,
      firstKnownAt: current.firstKnownAt,
      resetFrom: null,
      countedTowardsKnow: false,
    };
  }

  const knowCount = current.knowCount + 1;
  const justReachedThreshold = current.knowCount === KNOW_THRESHOLD - 1 && knowCount === KNOW_THRESHOLD;
  const hiddenUntil = justReachedThreshold ? addDays(now, HIDE_DAYS) : current.hiddenUntil;
  const firstKnownAt = current.firstKnownAt ?? now;

  return { mark: "KNOW", knowCount, hiddenUntil, firstKnownAt, resetFrom: null, countedTowardsKnow: true };
}
