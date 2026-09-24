import type { CountsAndShares, FlashcardCountInput } from "./types";

function wholePercent(count: number, total: number): number {
  return total === 0 ? 0 : Math.round((count / total) * 100);
}

/**
 * The four tile counters and their whole-percent shares over the approved pool — DEC-10, DEC-53.
 *
 * The denominator is every approved flashcard, hidden ones included (DEC-53): a card's mark alone
 * decides its bucket, so a card hidden for its week — still marked **Umiem** while hidden — still
 * counts in `know` (DEC-10). Shares are rounded independently to the nearest whole percent and are
 * not required to sum to 100.
 */
export function countsAndShares(cards: readonly FlashcardCountInput[]): CountsAndShares {
  const total = cards.length;
  const know = cards.filter((card) => card.mark === "KNOW").length;
  const repeat = cards.filter((card) => card.mark === "REPEAT").length;
  const unknown = cards.filter((card) => card.mark === "UNKNOWN").length;
  const notStarted = cards.filter((card) => card.mark === null).length;

  return {
    know,
    repeat,
    unknown,
    notStarted,
    knowShare: wholePercent(know, total),
    repeatShare: wholePercent(repeat, total),
    unknownShare: wholePercent(unknown, total),
    notStartedShare: wholePercent(notStarted, total),
  };
}
