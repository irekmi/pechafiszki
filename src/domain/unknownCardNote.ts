import { unknownNote } from "./unknownNote";
import type { Mark } from "./types";

/**
 * The DEC-20 note of one card on SCR-07's "Nie umiem" list. `cardEvents` are the card's events in
 * this session, oldest first; `unknownHistoryIds` are the ids of all the user's **Nie umiem** events
 * on it. The reset shown is the last one this session reported; the count of times marked stops at
 * the session's last **Nie umiem**, so a later session never changes it (AC-09.7).
 */
export function unknownCardNote(
  cardEvents: readonly { id: number; mark: Mark; resetFrom: number | null }[],
  unknownHistoryIds: readonly number[],
): string {
  const lastUnknownId = Math.max(...cardEvents.filter((event) => event.mark === "UNKNOWN").map((event) => event.id));
  const resetFrom = cardEvents.filter((event) => event.resetFrom !== null).at(-1)?.resetFrom ?? null;
  return unknownNote(resetFrom, unknownHistoryIds.filter((id) => id <= lastUnknownId).length);
}
