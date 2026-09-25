import { buildQueue } from "@/domain/buildQueue";
import { isHidden, expireHide } from "@/domain/hide";
import { matchesQuery } from "@/domain/matchesQuery";
import { earliestReturn } from "@/domain/earliestReturn";
import { partitionCandidates } from "@/domain/partitionCandidates";
import type { ProgressRecord, QueueEntry } from "@/domain/types";
import { db } from "@/server/db";
import { MARK_OF_FILTER, type SessionFilters } from "./sessionFilters";

export type BuiltQueue = {
  queue: QueueEntry[];
  /** Cards matching the filters, before any hide — 0 means "Brak wyników". */
  candidateCount: number;
  /** When the queue is empty only because every match is hidden: the first day one returns. */
  returnDate: Date | null;
};

type Candidate = { id: number; record: ProgressRecord | null; lastSeenAt: Date | null; hidden: boolean };

function hiddenUntilOf(candidate: Candidate): Date[] {
  return candidate.hidden && candidate.record?.hiddenUntil ? [candidate.record.hiddenUntil] : [];
}

/**
 * Loads the approved cards a learner's filters select and hands them to `buildQueue` (DEC-01,
 * DEC-07, DEC-08, DEC-09) — no ordering, cap, partition or return-date rule lives here: those are
 * `partitionCandidates`, `buildQueue` and `earliestReturn`. Progress is read through `expireHide`
 * (DEC-04), so a card whose week has ended is already back among the not-known ones.
 */
export async function buildSessionQueue(
  userId: number,
  filters: SessionFilters,
  now: Date = new Date(),
): Promise<BuiltQueue> {
  const cards = await db.flashcard.findMany({
    where: { status: "APPROVED", ...(filters.category ? { categoryId: filters.category } : {}) },
    select: {
      id: true,
      question: true,
      answer: true,
      progress: {
        where: { userId },
        select: { mark: true, knowCount: true, hiddenUntil: true, firstKnownAt: true, lastSeenAt: true },
      },
    },
  });

  const wanted = filters.mark ? MARK_OF_FILTER[filters.mark] : null;
  const candidates: Candidate[] = cards
    .filter((card) => matchesQuery([card.question, card.answer], filters.query ?? ""))
    .map((card) => {
      const row = card.progress[0];
      const record = row ? expireHide(row, now) : null;
      return { id: card.id, record, lastSeenAt: row?.lastSeenAt ?? null, hidden: !!record && isHidden(record, now) };
    })
    .filter((candidate) => wanted === null || candidate.record?.mark === wanted);

  const { notKnown, known } = partitionCandidates(
    candidates.map((c) => ({ flashcardId: c.id, mark: c.record?.mark ?? null, lastSeenAt: c.lastSeenAt, hidden: c.hidden })),
    wanted === "KNOW",
  );
  const queue = buildQueue(notKnown, known);
  const returnDate = queue.length === 0 ? earliestReturn(candidates.flatMap(hiddenUntilOf)) : null;
  return { queue, candidateCount: candidates.length, returnDate };
}
