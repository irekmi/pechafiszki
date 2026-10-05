import { shuffleTail, type RandomSource } from "./shuffleTail";
import type { QueueEntry } from "./types";

/**
 * **Przetasuj** — DEC-16, with the every-fifth pattern of DEC-01 re-applied (API-14).
 *
 * The current card and everything before it stay where they are, so "Fiszka 7 z 24" does not move
 * (`cursor` is the index of the card on screen). The unseen tail is reordered with `shuffleTail`,
 * but reinforcement cards are shuffled only among the reinforcement slots and ordinary cards only
 * among the ordinary ones: a known card never lands in an ordinary position or the other way round,
 * so the **Powtórka** positions stay exactly where DEC-01 put them.
 */
export function reshuffleUnseen(
  queue: readonly QueueEntry[],
  cursor: number,
  random: RandomSource,
): QueueEntry[] {
  const seenCount = cursor + 1;
  const tail = queue.slice(seenCount);
  const ordinary = shuffleTail(tail.filter((entry) => !entry.isReinforcement), 0, random);
  const reinforcement = shuffleTail(tail.filter((entry) => entry.isReinforcement), 0, random);
  let nextOrdinary = 0;
  let nextReinforcement = 0;
  const reordered = tail.map((slot) =>
    slot.isReinforcement ? reinforcement[nextReinforcement++]! : ordinary[nextOrdinary++]!,
  );
  return [...queue.slice(0, seenCount), ...reordered];
}
