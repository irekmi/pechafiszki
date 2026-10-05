import type { Decision, Role } from "@prisma/client";
import { db } from "@/server/db";
import { getFlashcard, type FlashcardDetail } from "./getFlashcard";

export type LatestDecision = { decision: Decision; reason: string | null; decidedAt: Date; decidedBy: string | null };

export type EditCard = {
  detail: FlashcardDetail;
  /** The most recent Moderation Decision, kept across resubmissions (DEC-31); `null` if never decided. */
  latest: LatestDecision | null;
};

/**
 * API-07 for SCR-12: the card plus what the form needs beyond it. `null` — for a missing card, a card
 * the caller may not read, and a card they may not edit (their own approved one, DEC-57) alike — so the
 * page ends in the same 404 for all three. The edit rule itself is `canEditFlashcard` in `permissions.ts`.
 */
export async function getEditCard(user: { id: number; role: Role }, id: number): Promise<EditCard | null> {
  const detail = await getFlashcard(user, id);
  if (!detail || !detail.canEdit) return null;

  const row = await db.flashcard.findUnique({
    where: { id },
    select: {
      decisions: {
        orderBy: [{ decidedAt: "desc" }, { id: "desc" }],
        take: 1,
        select: { decision: true, reason: true, decidedAt: true, decidedBy: { select: { nickname: true } } },
      },
    },
  });
  if (!row) return null;
  const [last] = row.decisions;
  return {
    detail,
    latest: last ? { ...last, decidedBy: last.decidedBy?.nickname ?? null } : null,
  };
}
