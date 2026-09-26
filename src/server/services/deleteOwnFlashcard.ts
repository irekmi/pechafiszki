import { db } from "@/server/db";
import { REFUSED, type EditResult } from "./editResult";

/**
 * API-18 — the author withdraws their own undecided card (DEC-38). Ownership and the status are in the
 * DELETE's WHERE, so another person's card and an approved one match nothing and answer as a missing
 * card does. The database cascades Moderation Decisions, progress and Review Events (DEC-37).
 */
export async function deleteOwnFlashcard(user: { id: number }, id: number): Promise<EditResult> {
  const removed = await db.flashcard.deleteMany({
    where: { id, authorId: user.id, status: { in: ["PENDING", "REJECTED"] } },
  });
  return removed.count === 1 ? { ok: true } : REFUSED.notFound;
}
