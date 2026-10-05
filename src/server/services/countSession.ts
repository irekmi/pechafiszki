import type { StudySession } from "@prisma/client";
import { countResetCards } from "@/domain/countResetCards";
import { hiddenInSession } from "@/domain/hiddenInSession";
import { summariseSession } from "@/domain/summariseSession";
import { db } from "@/server/db";
import type { SessionFigures } from "./frozenSummary";

/** A session's own Review Events, oldest first — the query filters on `sessionId` (AQ-001, AC-09.13). */
export function loadSessionEvents(sessionId: number) {
  return db.reviewEvent.findMany({
    where: { sessionId },
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
}

export type SessionEvents = Awaited<ReturnType<typeof loadSessionEvents>>;

/**
 * The counting rules of SCR-07 (DEC-19, DEC-20, DEC-05, all `src/domain/` functions) applied to one
 * session's events; nothing is read from the cards' current state, so re-marking a card later never
 * changes an old summary (AC-09.7).
 */
export async function countSession(session: Pick<StudySession, "id" | "userId">, events: SessionEvents): Promise<SessionFigures> {
  const hidingIds = [...new Set(events.filter((event) => event.mark === "KNOW" && event.countedTowardsKnow).map((event) => event.flashcardId))];
  const history = hidingIds.length === 0 ? [] : await db.reviewEvent.findMany({
    where: { userId: session.userId, flashcardId: { in: hidingIds }, id: { lte: Math.max(...events.map((event) => event.id)) } },
    orderBy: { id: "asc" },
    select: { flashcardId: true, sessionId: true, mark: true, countedTowardsKnow: true, createdAt: true },
  });
  const hidden = hiddenInSession(history, session.id);
  return {
    ...summariseSession(events),
    resetCount: countResetCards(events),
    hiddenThisSession: hidden.count,
    returnDate: hidden.returnDate,
  };
}
