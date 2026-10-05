/**
 * How many distinct cards had their **Umiem** counter reset by a marking of this session (DEC-19).
 * A card reset twice counts once; a marking with `resetFrom: null` reset nothing.
 */
export function countResetCards(events: readonly { flashcardId: number; resetFrom: number | null }[]): number {
  return new Set(events.filter((event) => event.resetFrom !== null).map((event) => event.flashcardId)).size;
}
