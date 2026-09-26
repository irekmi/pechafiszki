import type { Decision } from "@prisma/client";
import { db } from "@/server/db";

export type DecisionResult =
  | { ok: true }
  | { ok: false; reason: "already-decided" }
  | { ok: false; reason: "invalid"; message: string };

export const CATEGORY_MISSING = "Wybrana kategoria nie istnieje";

type DecisionInput = {
  id: number;
  decision: Decision;
  adminId: number;
  reason: string | null;
  /** API-20's optional `category`: the pool category the card enters under (SCR-17). */
  categoryId?: number;
};

/**
 * The one write both decisions go through (REQ-01, ENT-04): Pending → Approved or Rejected, plus its
 * Moderation Decision, in one transaction. The `status: PENDING` condition sits inside the UPDATE, so
 * two administrators deciding the same card at once cannot both win — the second matches no row and is
 * told the card was already reviewed; nothing is overwritten (DEC-33). A card that no longer exists
 * is no longer pending either, and answers the same way. A category, when given, is written by the
 * same UPDATE, so the status and the category the card enters the pool under cannot diverge.
 */
export async function recordDecision(input: DecisionInput): Promise<DecisionResult> {
  const { id, decision, adminId, reason, categoryId } = input;
  return db.$transaction(async (tx) => {
    if (categoryId !== undefined && !(await tx.category.findUnique({ where: { id: categoryId }, select: { id: true } }))) {
      return { ok: false, reason: "invalid", message: CATEGORY_MISSING };
    }
    const decidedAt = new Date();
    const moved = await tx.flashcard.updateMany({
      where: { id, status: "PENDING" },
      data: { status: decision, decidedAt, ...(categoryId === undefined ? {} : { categoryId }) },
    });
    if (moved.count === 0) return { ok: false, reason: "already-decided" };
    await tx.moderationDecision.create({
      data: { flashcardId: id, decision, reason, decidedById: adminId, decidedAt },
    });
    return { ok: true };
  });
}
