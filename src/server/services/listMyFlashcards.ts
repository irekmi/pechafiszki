import type { FlashcardStatus } from "@prisma/client";
import { db } from "@/server/db";
import type { MyCardsStatus } from "./myCardsParams";

export type MyCardRow = {
  id: number;
  category: string;
  question: string;
  status: FlashcardStatus;
  submittedAt: Date;
  decidedAt: Date | null;
  rejectionReason: string | null;
};

export type MyCardsCounts = { all: number; pending: number; approved: number; rejected: number };

const STATUS_OF: Record<MyCardsStatus, FlashcardStatus> = {
  pending: "PENDING",
  approved: "APPROVED",
  rejected: "REJECTED",
};

/**
 * API-15 — the person's own submissions, newest first, with the four tab counts. Every query is
 * scoped by `authorId: userId` — the id the caller takes from the session — so another person's
 * cards, and an administrator's view of the whole pool, cannot appear here (AC-13.8, REQ-02). The
 * counts ignore the `status` filter, so every tab keeps its number. The reason shown for a rejected
 * card is the most recent Moderation Decision's (DEC-31).
 */
export async function listMyFlashcards(
  userId: number,
  status?: MyCardsStatus,
): Promise<{ rows: MyCardRow[]; counts: MyCardsCounts }> {
  const [cards, groups] = await Promise.all([
    db.flashcard.findMany({
      where: { authorId: userId, ...(status ? { status: STATUS_OF[status] } : {}) },
      orderBy: [{ submittedAt: "desc" }, { id: "desc" }],
      select: {
        id: true,
        question: true,
        status: true,
        submittedAt: true,
        decidedAt: true,
        category: { select: { name: true } },
        decisions: {
          orderBy: [{ decidedAt: "desc" }, { id: "desc" }],
          take: 1,
          select: { decision: true, reason: true, decidedAt: true },
        },
      },
    }),
    db.flashcard.groupBy({ by: ["status"], where: { authorId: userId }, _count: { _all: true } }),
  ]);

  const count = (of: FlashcardStatus) => groups.find((group) => group.status === of)?._count._all ?? 0;
  const counts = { pending: count("PENDING"), approved: count("APPROVED"), rejected: count("REJECTED") };

  const rows = cards.map((card) => {
    const latest = card.decisions[0];
    return {
      id: card.id,
      category: card.category.name,
      question: card.question,
      status: card.status,
      submittedAt: card.submittedAt,
      // A pending card has no current decision, even when an earlier one is kept (DEC-31).
      decidedAt: card.status === "PENDING" ? null : (card.decidedAt ?? latest?.decidedAt ?? null),
      rejectionReason: card.status === "REJECTED" && latest?.decision === "REJECTED" ? latest.reason : null,
    };
  });
  return { rows, counts: { all: counts.pending + counts.approved + counts.rejected, ...counts } };
}
