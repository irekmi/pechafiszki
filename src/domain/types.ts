/**
 * Plain data types the study rules operate on (NFR-02): no Prisma import, no React import. These
 * mirror the field names of `ENT-05 CardProgress` and `ENT-06 ReviewEvent` in
 * `prisma/schema.prisma`, so mapping them at a service's boundary is a straight assignment.
 */

/** A learner's judgement of one card — mirrors the `Mark` enum in `prisma/schema.prisma`. */
export type Mark = "KNOW" | "REPEAT" | "UNKNOWN";

/** One learner's standing on one flashcard — the fields `applyMark` and `hide.ts` operate on. */
export interface ProgressRecord {
  mark: Mark;
  knowCount: number;
  hiddenUntil: Date | null;
  firstKnownAt: Date | null;
}

/** What one marking changes on a `ProgressRecord`, plus what its `ReviewEvent` records. */
export interface MarkOutcome {
  mark: Mark;
  knowCount: number;
  hiddenUntil: Date | null;
  firstKnownAt: Date | null;
  /** The `knowCount` this marking reset from, or `null` when it did not reset one (DEC-03). */
  resetFrom: number | null;
  /** Whether this marking is the one that counts towards the Umiem tile this session (DEC-14). */
  countedTowardsKnow: boolean;
}

/** A not-yet-known candidate available to draw into a session queue (DEC-08's three groups). */
export interface NotKnownCandidate {
  flashcardId: number;
  group: "UNKNOWN" | "REPEAT" | "NOT_STARTED";
  /** `null` for a card never seen — sorts before any seen card within its group. */
  lastSeenAt: Date | null;
}

/** A known candidate eligible to fill a reinforcement slot — a hidden card is eligible (DEC-09). */
export interface KnownCandidate {
  flashcardId: number;
}

/** One drawn entry in a session queue. */
export interface QueueEntry {
  flashcardId: number;
  isReinforcement: boolean;
}

/** Start and end (both inclusive) of one Monday-to-Sunday week, as UTC instants (DEC-06). */
export interface WeekBounds {
  start: Date;
  end: Date;
}

/** One approved card's mark, or `null` when nobody has studied it yet ("Nie zaczęte"). */
export interface FlashcardCountInput {
  mark: Mark | null;
}

/** The four tile counters and their whole-percent shares over the approved pool (DEC-53). */
export interface CountsAndShares {
  know: number;
  repeat: number;
  unknown: number;
  notStarted: number;
  knowShare: number;
  repeatShare: number;
  unknownShare: number;
  notStartedShare: number;
}
