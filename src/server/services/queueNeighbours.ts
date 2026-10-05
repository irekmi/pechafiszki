export type QueuePosition = { position: number; total: number; previousId: number | null; nextId: number | null };

/**
 * SCR-17's place in the approval queue. `ids` are the pending cards in queue order (API-19, oldest
 * first). Prev/next wrap around, and are `null` only when this card is the queue's only one — the
 * spec makes them inactive in exactly that case. A card not in the queue (already decided) has no
 * position at all.
 */
export function queueNeighbours(ids: number[], id: number): QueuePosition | null {
  const index = ids.indexOf(id);
  if (index === -1) return null;
  const alone = ids.length === 1;
  return {
    position: index + 1,
    total: ids.length,
    previousId: alone ? null : (ids[(index - 1 + ids.length) % ids.length] ?? null),
    nextId: alone ? null : (ids[(index + 1) % ids.length] ?? null),
  };
}
