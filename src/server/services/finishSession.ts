import { db } from "@/server/db";
import { buildSessionSummary, type SessionSummary } from "./buildSessionSummary";

/**
 * API-13 — closes the caller's session and returns its summary. Own session only: the lookup is by
 * `userId`, so another person's id and an id that does not exist are the same `null` (DEC-57).
 * Idempotent: `endedAt` is written once, by a conditional update, so a reload or a second call
 * closes nothing again and every number — the duration included — stays as the first call left it.
 */
export async function finishSession(userId: number, sessionId: number): Promise<SessionSummary | null> {
  const found = await db.studySession.findFirst({ where: { id: sessionId, userId } });
  if (!found) return null;
  if (!found.endedAt) {
    await db.studySession.updateMany({ where: { id: found.id, endedAt: null }, data: { endedAt: new Date() } });
  }
  const closed = found.endedAt ? found : await db.studySession.findFirst({ where: { id: sessionId, userId } });
  if (!closed?.endedAt) return null;
  return buildSessionSummary({ ...closed, endedAt: closed.endedAt });
}
