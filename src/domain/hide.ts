import type { ProgressRecord } from "./types";

/**
 * Whether a card is hidden from session queues at the given instant — DEC-05.
 *
 * `hiddenUntil` is compared with strict greater-than, so the card is hidden through the last
 * millisecond before `hiddenUntil` and visible again exactly at `hiddenUntil`. `hiddenUntil` is
 * stored as an absolute UTC instant (set by `applyMark`), so this comparison needs no timezone —
 * DEC-06 only matters where a calendar date is computed, in `week.ts`.
 */
export function isHidden(progress: ProgressRecord, now: Date): boolean {
  return progress.hiddenUntil !== null && progress.hiddenUntil.getTime() > now.getTime();
}

/**
 * The state a card returns to once its week of hiding has ended — DEC-04, DEC-06.
 *
 * A card still hidden, or never hidden, is returned unchanged: `isHidden` and `applyMark` are what
 * change it while the hide is live. `firstKnownAt` is preserved, since DEC-02 fixes it forever
 * once set. A hidden card stays readable and markable throughout (DEC-11) — nothing here removes a
 * card from view; this function only recomputes what state a *read* should see once the week has
 * passed, so callers apply it at load time rather than on a schedule.
 */
export function expireHide(progress: ProgressRecord, now: Date): ProgressRecord {
  if (progress.hiddenUntil === null || isHidden(progress, now)) {
    return progress;
  }
  return { mark: "REPEAT", knowCount: 0, hiddenUntil: null, firstKnownAt: progress.firstKnownAt };
}
