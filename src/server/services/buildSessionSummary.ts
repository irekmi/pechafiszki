import type { StudySession } from "@prisma/client";
import { sessionDurationMinutes } from "@/domain/sessionDuration";
import { db } from "@/server/db";
import { countSession, loadSessionEvents } from "./countSession";
import { parseFrozenFigures } from "./frozenSummary";
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
 * Every figure of a finished session. The counters come from the figures frozen when a card it marked
 * was deleted (DEC-37), otherwise from **its own** Review Events (`countSession`) — so a marking with
 * a null session (SCR-09, AQ-001) can never appear and re-marking a card later never changes an old
 * summary (AC-09.7). The "Nie umiem" list is the cards that still exist.
 */
export async function buildSessionSummary(session: StudySession & { endedAt: Date }): Promise<SessionSummary> {
  const events = await loadSessionEvents(session.id);
  const filters = parseStoredFilters(session.filters);
  const figures = parseFrozenFigures(session.frozenSummary) ?? (await countSession(session, events));

  const category = filters.category
    ? await db.category.findUnique({ where: { id: filters.category }, select: { name: true } })
    : null;

  return {
    sessionId: session.id,
    ...figures,
    queued: parseStoredQueue(session.queue).length,
    durationMinutes: sessionDurationMinutes(session.startedAt, session.endedAt),
    startedAt: session.startedAt,
    categoryName: category?.name ?? null,
    unknownCards: await loadUnknownCards(session.userId, events),
    filters,
  };
}
