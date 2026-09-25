import { expireHide } from "@/domain/hide";
import { db } from "@/server/db";
import { buildSessionQueue } from "./buildSessionQueue";
import { loadQueueCards } from "./loadQueueCards";
import { findOpenSession } from "./openSession";
import type { SessionQueueResult } from "./sessionQueueResult";
import { queueToJson } from "./sessionFilters";

/**
 * API-11 — the card at the cursor, its progress and the counters SCR-06 draws. Own session only:
 * the lookup is by the caller's id. A card deleted (or no longer approved) since the queue was built
 * is dropped from the stored queue and the total adjusts, with no error (DEC-59). `cursorParam`
 * moves the cursor (Poprzednia / Następna / swipe); the resulting cursor is persisted so a reload
 * resumes in place (DEC-12). A cursor past the last card is `finished` — ST-09 closes the session.
 */
export async function getSessionQueue(
  userId: number,
  cursorParam?: number,
): Promise<SessionQueueResult> {
  const session = await findOpenSession(userId);
  if (!session) return { status: "none" };

  const live = await loadQueueCards(
    userId,
    session.queue.map((entry) => entry.flashcardId),
  );
  const queue = session.queue.filter((entry) => live.has(entry.flashcardId));
  const skippedBefore = session.queue
    .slice(0, session.cursor)
    .filter((entry) => !live.has(entry.flashcardId)).length;

  let cursor = session.cursor - skippedBefore;
  if (cursorParam !== undefined && cursorParam >= 0 && cursorParam <= queue.length) cursor = cursorParam;

  if (queue.length !== session.queue.length || cursor !== session.cursor) {
    await db.studySession.update({
      where: { id: session.id },
      data: { queue: queueToJson(queue), cursor },
    });
  }

  if (queue.length === 0) {
    const { candidateCount, returnDate } = await buildSessionQueue(userId, session.filters);
    const kind = candidateCount === 0 ? "no-results" : "all-hidden";
    return { status: "empty", kind, filters: session.filters, returnDate };
  }
  const entry = queue[cursor];
  if (!entry) return { status: "finished" };

  const row = live.get(entry.flashcardId)!;
  const progress = row.progress[0];
  const effective = progress ? expireHide(progress, new Date()) : null;
  return {
    status: "ok",
    sessionId: session.id,
    card: {
      id: row.id,
      question: row.question,
      answer: row.answer,
      codeExample: row.codeExample,
      category: row.category,
    },
    isReinforcement: entry.isReinforcement,
    position: cursor + 1,
    total: queue.length,
    progressPercent: Math.round(((cursor + 1) / queue.length) * 100),
    mark: effective?.mark ?? null,
    knowCount: effective?.knowCount ?? 0,
    lastSeenAt: progress?.lastSeenAt ?? null,
    filters: session.filters,
  };
}
