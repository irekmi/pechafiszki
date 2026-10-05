import type { KnownCandidate, NotKnownCandidate, QueueEntry } from "./types";

const QUEUE_CAP = 20;
const REINFORCEMENT_EVERY = 5;

const GROUP_ORDER: Record<NotKnownCandidate["group"], number> = {
  UNKNOWN: 0,
  REPEAT: 1,
  NOT_STARTED: 2,
};

function sortNotKnown(candidates: readonly NotKnownCandidate[]): NotKnownCandidate[] {
  return [...candidates].sort((a, b) => {
    const groupDiff = GROUP_ORDER[a.group] - GROUP_ORDER[b.group];
    if (groupDiff !== 0) return groupDiff;
    const aTime = a.lastSeenAt?.getTime() ?? -Infinity;
    const bTime = b.lastSeenAt?.getTime() ?? -Infinity;
    return aTime - bTime;
  });
}

/**
 * Builds one session queue from the cards the learner does not yet know — DEC-01, DEC-07, DEC-08,
 * DEC-09.
 *
 * `notKnown` is drawn **Nie umiem** first, then **Do powtórki**, then never-seen, least-recently-
 * seen first within each group (DEC-08), capped at 20 (DEC-07). Every fifth position holds a
 * reinforcement card from `known` instead of the next `notKnown` draw — `known` is the caller's
 * concern, and may include a card currently hidden for its week, which is still eligible to fill
 * this slot (DEC-09). When `known` is exhausted, that position falls back to the next `notKnown`
 * card rather than being left empty (DEC-01). The queue ends once `notKnown` is exhausted, even
 * short of the cap: it is drawn from the filtered set, not padded with extra reinforcement
 * (DEC-07 — "the queue is the whole set").
 */
export function buildQueue(
  notKnown: readonly NotKnownCandidate[],
  known: readonly KnownCandidate[],
  cap: number = QUEUE_CAP,
): QueueEntry[] {
  const sorted = sortNotKnown(notKnown);
  const entries: QueueEntry[] = [];
  let unknownIndex = 0;
  let knownIndex = 0;

  while (entries.length < cap && unknownIndex < sorted.length) {
    const position = entries.length + 1;
    const isReinforcementSlot = position % REINFORCEMENT_EVERY === 0;

    if (isReinforcementSlot && knownIndex < known.length) {
      entries.push({ flashcardId: known[knownIndex]!.flashcardId, isReinforcement: true });
      knownIndex++;
      continue;
    }

    entries.push({ flashcardId: sorted[unknownIndex]!.flashcardId, isReinforcement: false });
    unknownIndex++;
  }

  return entries;
}
