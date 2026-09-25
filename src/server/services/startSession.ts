import { db } from "@/server/db";
import { buildSessionQueue } from "./buildSessionQueue";
import { filtersToJson, normaliseFilters, queueToJson, type SessionFilters } from "./sessionFilters";

/**
 * API-10 — opens a Study Session and builds its queue. Any session still open for this learner is
 * closed first (DEC-13), and the new row is written at once (DEC-12), so a reload resumes in place.
 * An empty queue still opens a session: SCR-06 draws its empty state from the stored filters.
 */
export async function startSession(
  userId: number,
  filters: SessionFilters,
): Promise<{ sessionId: number; queueLength: number }> {
  const clean = normaliseFilters(filters);
  const now = new Date();
  const { queue } = await buildSessionQueue(userId, clean, now);

  return db.$transaction(async (tx) => {
    await tx.studySession.updateMany({ where: { userId, endedAt: null }, data: { endedAt: now } });
    const session = await tx.studySession.create({
      data: {
        userId,
        startedAt: now,
        filters: filtersToJson(clean),
        queue: queueToJson(queue),
        cursor: 0,
      },
    });
    return { sessionId: session.id, queueLength: queue.length };
  });
}
