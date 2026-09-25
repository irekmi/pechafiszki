/**
 * When a session comes up empty only because every matching card is hidden, the first day one of
 * them returns — the earliest `hiddenUntil` (DEC-05, DEC-04). `null` when nothing is hidden. The
 * caller passes only the `hiddenUntil` of cards that are hidden right now.
 */
export function earliestReturn(hiddenUntil: readonly Date[]): Date | null {
  if (hiddenUntil.length === 0) return null;
  return new Date(Math.min(...hiddenUntil.map((date) => date.getTime())));
}
