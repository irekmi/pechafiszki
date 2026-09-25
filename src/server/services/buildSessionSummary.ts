import type { StudySession } from "@prisma/client";
import { countResetCards } from "@/domain/countResetCards";
import { hiddenInSession } from "@/domain/hiddenInSession";
import { sessionDurationMinutes } from "@/domain/sessionDuration";
import { summariseSession } from "@/domain/summariseSession";
import { db } from "@/server/db";
import { loadUnknownCards, type UnknownCard } from "./loadUnknownCards";
import { parseStoredFilters, parseStoredQueue, type SessionFilters } from "./sessionFilters";

/** API-13's `ok` shape, plus what the sub-line of SCR-07 needs (`startedAt`, the category's name). */
export type SessionSummary = {
  sessionId: number;
  reviewed: number;
  queued: number;
  know: number;
  knowReinforcements: number;
  repeat: number;
  unknown: number;
  resetCount: number;
  hiddenThisSession: number;
  returnDate: Date | null;
  durationMinutes: number;
  startedAt: Date;
  categoryName: string | null;
  unknownCards: UnknownCard[];
  filters: SessionFilters;
};

/**
 * Every figure of a finished session, read from **its own** Review Events — the query filters on
 * `sessionId`, so a marking with a null session (SCR-09, AQ-001) can never appear. The counting
 * rules are `src/domain/` functions (DEC-19, DEC-20, DEC-05); nothing is read from the cards' current
 * state, so re-marking a card later never changes an old summary (AC-09.7).
 */
export async function buildSessionSummary(session: StudySession & { endedAt: Date }): Promise<SessionSummary> {
  const events = await db.reviewEvent.findMany({
    where: { sessionId: session.id },
    orderBy: { id: "asc" },
    select: {
      id: true,
      flashcardId: true,
      mark: true,
      wasReinforcement: true,
      countedTowardsKnow: true,
      resetFrom: true,
      createdAt: true,
    },
  });
  const filters = parseStoredFilters(session.filters);

  const hidingIds = [...new Set(events.filter((event) => event.mark === "KNOW" && event.countedTowardsKnow).map((event) => event.flashcardId))];
  const history = hidingIds.length === 0 ? [] : await db.reviewEvent.findMany({
    where: { userId: session.userId, flashcardId: { in: hidingIds }, id: { lte: Math.max(...events.map((event) => event.id)) } },
    orderBy: { id: "asc" },
    select: { flashcardId: true, sessionId: true, mark: true, countedTowardsKnow: true, createdAt: true },
  });
  const hidden = hiddenInSession(history, session.id);

  const category = filters.category
    ? await db.category.findUnique({ where: { id: filters.category }, select: { name: true } })
    : null;

  return {
    sessionId: session.id,
    ...summariseSession(events),
    queued: parseStoredQueue(session.queue).length,
    resetCount: countResetCards(events),
    hiddenThisSession: hidden.count,
    returnDate: hidden.returnDate,
    durationMinutes: sessionDurationMinutes(session.startedAt, session.endedAt),
    startedAt: session.startedAt,
    categoryName: category?.name ?? null,
    unknownCards: await loadUnknownCards(session.userId, events),
    filters,
  };
}
