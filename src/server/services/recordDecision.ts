import type { Decision } from "@prisma/client";
import { db } from "@/server/db";

export type DecisionResult =
  | { ok: true }
  | { ok: false; reason: "already-decided" }
  | { ok: false; reason: "invalid"; message: string };

type DecisionInput = { id: number; decision: Decision; adminId: number; reason: string | null };

/**
 * The one write both decisions go through (REQ-01, ENT-04): Pending → Approved or Rejected, plus its
 * Moderation Decision, in one transaction. The `status: PENDING` condition sits inside the UPDATE, so
 * two administrators deciding the same card at once cannot both win — the second matches no row and is
 * told the card was already reviewed; nothing is overwritten (DEC-33). A card that no longer exists
 * is no longer pending either, and answers the same way.
 */
export async function recordDecision({ id, decision, adminId, reason }: DecisionInput): Promise<DecisionResult> {
  return db.$transaction(async (tx) => {
    const decidedAt = new Date();
    const moved = await tx.flashcard.updateMany({
      where: { id, status: "PENDING" },
      data: { status: decision, decidedAt },
    });
    if (moved.count === 0) return { ok: false, reason: "already-decided" };
    await tx.moderationDecision.create({
      data: { flashcardId: id, decision, reason, decidedById: adminId, decidedAt },
    });
    return { ok: true };
  });
}
