import { db } from "@/server/db";
import { REFUSED, cardFields, categoryExists, type EditResult } from "./editResult";
import type { SubmitFlashcardInput } from "./submitFlashcard";

/**
 * API-17 — the author corrects their own undecided card and sends it back to the queue (DEC-30): the
 * status becomes `PENDING` and `decidedAt` is cleared. Earlier Moderation Decisions are not touched
 * (DEC-31). Who may do this is part of the UPDATE's WHERE — the caller's own row, still `PENDING` or
 * `REJECTED` — so a save racing an approval matches no row and writes nothing (DEC-58), and a card
 * that is not theirs cannot be written whatever the request says. The caller has passed `requireUser`.
 */
export async function updateOwnFlashcard(
  user: { id: number },
  id: number,
  input: SubmitFlashcardInput,
): Promise<EditResult> {
  if (!(await categoryExists(input.category))) return REFUSED.category;

  const moved = await db.flashcard.updateMany({
    where: { id, authorId: user.id, status: { in: ["PENDING", "REJECTED"] } },
    data: { ...cardFields(input), status: "PENDING", decidedAt: null },
  });
  if (moved.count === 1) return { ok: true };

  // Nothing matched. Only the author is told it was the approval; everyone else, and a missing row,
  // get the answer a missing card gets.
  const row = await db.flashcard.findUnique({ where: { id }, select: { authorId: true, status: true } });
  return row?.authorId === user.id && row.status === "APPROVED" ? REFUSED.approved : REFUSED.notFound;
}
