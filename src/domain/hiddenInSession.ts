import { HIDE_DAYS, KNOW_THRESHOLD, addDays } from "./applyMark";
import { earliestReturn } from "./earliestReturn";
import type { Mark } from "./types";

/** One of the user's Review Events for a card, as recorded (ENT-06) — never the card's current state. */
export interface HistoryEvent {
  flashcardId: number;
  sessionId: number | null;
  mark: Mark;
  countedTowardsKnow: boolean;
  createdAt: Date;
}

interface Streak {
  count: number;
  hiddenUntil: Date | null;
}

/**
 * The cards this session hid for a week (DEC-05, DEC-19), read from the user's Review Events alone
 * (oldest first), so re-marking a card after the session cannot change an old summary (AC-09.7).
 * Replays each card's **Umiem** streak the way `applyMark` and `expireHide` keep it: a **Do
 * powtórki** or **Nie umiem** clears it, a counted **Umiem** raises it, and any event on or after the
 * end of a hide starts the streak over. The counted **Umiem** that makes the fifth in a row is the
 * hiding one; the card comes back seven days after that event. A card marked again in this same
 * session with something other than **Umiem** is no longer hidden. `returnDate` is the earliest one.
 */
export function hiddenInSession(
  history: readonly HistoryEvent[],
  sessionId: number,
): { count: number; returnDate: Date | null } {
  const streaks = new Map<number, Streak>();
  const returns = new Map<number, Date>();
  for (const event of history) {
    let streak = streaks.get(event.flashcardId) ?? { count: 0, hiddenUntil: null };
    if (streak.hiddenUntil && event.createdAt.getTime() >= streak.hiddenUntil.getTime()) {
      streak = { count: 0, hiddenUntil: null };
    }
    if (event.mark !== "KNOW") {
      streak = { count: 0, hiddenUntil: null };
      returns.delete(event.flashcardId);
    } else if (event.countedTowardsKnow) {
      const count = streak.count + 1;
      if (count === KNOW_THRESHOLD) {
        const due = addDays(event.createdAt, HIDE_DAYS);
        streak = { count, hiddenUntil: due };
        if (event.sessionId === sessionId) returns.set(event.flashcardId, due);
      } else {
        streak = { ...streak, count };
      }
    }
    streaks.set(event.flashcardId, streak);
  }
  return { count: returns.size, returnDate: earliestReturn([...returns.values()]) };
}
