import { reshuffleUnseen } from "@/domain/reshuffleUnseen";
import { db } from "@/server/db";
import { findOpenSession } from "./openSession";
import { queueToJson } from "./sessionFilters";

/**
 * API-14 — **Przetasuj**. Only the caller's own open session can be shuffled; only the cards after
 * the one on screen move (DEC-16), so the position counter stays where it is.
 */
export async function shuffleSession(
  userId: number,
  sessionId: number,
): Promise<{ status: "ok" | "forbidden" }> {
  const session = await findOpenSession(userId);
  if (!session || session.id !== sessionId) return { status: "forbidden" };
  const queue = reshuffleUnseen(session.queue, session.cursor, Math.random);
  await db.studySession.update({ where: { id: session.id }, data: { queue: queueToJson(queue) } });
  return { status: "ok" };
}
