import type { KnownCandidate, Mark, NotKnownCandidate } from "./types";

/** One approved card matching the learner's filters, with its standing already read through `expireHide`. */
export interface PoolCandidate {
  flashcardId: number;
  /** The effective mark, or `null` for a card never marked ("Nie zaczęte"). */
  mark: Mark | null;
  lastSeenAt: Date | null;
  /** Whether the card is inside its hidden week right now (DEC-04, DEC-05). */
  hidden: boolean;
}

export interface PartitionedPool {
  notKnown: NotKnownCandidate[];
  known: KnownCandidate[];
}

function seenTime(candidate: PoolCandidate): number {
  return candidate.lastSeenAt?.getTime() ?? -Infinity;
}

function groupOf(mark: Mark | null): NotKnownCandidate["group"] {
  return mark === "UNKNOWN" || mark === "REPEAT" ? mark : "NOT_STARTED";
}

/**
 * Splits the filtered cards into the two lists `buildQueue` takes: the ordinary pool and the
 * reinforcement pool (DEC-01, DEC-08, DEC-09).
 *
 * Normally the ordinary pool is every card that is not known, and every known card — hidden ones
 * included (DEC-09) — is reinforcement, least recently seen first (SQ-08.2, provisional). When no
 * not-known card matches, or the marking chip is **Umiem** (`onlyKnown`), the non-hidden known cards
 * become the ordinary pool and the hidden ones the reinforcement pool, so a learner who knows
 * everything can still study (SQ-08.1, provisional).
 */
export function partitionCandidates(
  candidates: readonly PoolCandidate[],
  onlyKnown: boolean,
): PartitionedPool {
  const known = candidates.filter((c) => c.mark === "KNOW").sort((a, b) => seenTime(a) - seenTime(b));
  const notKnown = candidates.filter((c) => c.mark !== "KNOW");
  const ordinaryIsNotKnown = notKnown.length > 0 && !onlyKnown;

  const ordinary = ordinaryIsNotKnown ? notKnown : known.filter((c) => !c.hidden);
  const reinforcement = ordinaryIsNotKnown ? known : known.filter((c) => c.hidden);
  return {
    notKnown: ordinary.map((c) => ({ flashcardId: c.flashcardId, group: groupOf(c.mark), lastSeenAt: c.lastSeenAt })),
    known: reinforcement.map((c) => ({ flashcardId: c.flashcardId })),
  };
}
