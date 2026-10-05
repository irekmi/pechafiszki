import { db } from "@/server/db";
import { REFUSED, type EditResult } from "./editResult";
import { freezeSessionFigures } from "./freezeSessionFigures";

/**
 * API-23 — removes a card from the system in any status (DEC-37). The row goes and the database
 * cascades its Moderation Decisions, every learner's progress and its Review Events. Past session
 * summaries are unaffected: the counters of each finished session that marked the card are stored
 * first, in the same transaction (`freezeSessionFigures`). The caller has passed `requireAdmin`.
 */
export async function deleteFlashcard(id: number): Promise<EditResult> {
  const frozen = await freezeSessionFigures(id);
  const removed = await db.$transaction(async (tx) => {
    for (const session of frozen) {
      await tx.studySession.update({ where: { id: session.id }, data: { frozenSummary: session.frozenSummary } });
    }
    return tx.flashcard.deleteMany({ where: { id } });
  });
  return removed.count === 1 ? { ok: true } : REFUSED.notFound;
}
