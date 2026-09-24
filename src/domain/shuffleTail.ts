import type { QueueEntry } from "./types";

/**
 * A source of numbers in `[0, 1)` — inject `Math.random` in production and a seeded generator in
 * tests, so the same source yields the same order both times (`shuffleTail`'s own determinism).
 */
export type RandomSource = () => number;

function fisherYatesShuffle<T>(items: readonly T[], random: RandomSource): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const swap = result[i]!;
    result[i] = result[j]!;
    result[j] = swap;
  }
  return result;
}

/**
 * **Przetasuj** reorders only the cards not yet seen — DEC-16.
 *
 * `seenCount` is the number of entries already shown (the session's cursor); everything before it
 * keeps its position and value, so "Fiszka 7 z 24" does not move under the learner. Everything from
 * `seenCount` onward is reordered with the injected `random` source, deterministically for a given
 * source.
 */
export function shuffleTail(
  queue: readonly QueueEntry[],
  seenCount: number,
  random: RandomSource,
): QueueEntry[] {
  const head = queue.slice(0, seenCount);
  const tail = queue.slice(seenCount);
  return [...head, ...fisherYatesShuffle(tail, random)];
}
