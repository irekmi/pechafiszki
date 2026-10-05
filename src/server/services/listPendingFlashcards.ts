import type { FlashcardStatus } from "@prisma/client";
import { db } from "@/server/db";
import { answerExcerpt } from "./answerExcerpt";
import type { QueueParams, QueueTab } from "./adminQueueParams";
import { getPendingQueueCount } from "./getPendingQueueCount";

export type QueueRow = {
  id: number;
  category: string;
  question: string;
  answerExcerpt: string;
  author: string | null;
  submittedAt: Date;
};

export type QueueCounts = { pending: number; approved: number; rejected: number };

export type PendingQueue = {
  rows: QueueRow[];
  /** Per tab, for the category in force — so each equals the rows its tab lists (AC-14.10). */
  counts: QueueCounts;
  /** The whole queue whatever the filter: the heading and the sub-navigation badge. */
  pendingTotal: number;
  /** The category filter actually applied; an id that names no category is ignored. */
  category: number | undefined;
};

const STATUS_OF: Record<QueueTab, FlashcardStatus> = {
  pending: "PENDING",
  approved: "APPROVED",
  rejected: "REJECTED",
};

/**
 * API-19 — the approval queue and its two read-only history tabs (DEC-34). Administrator only: the
 * caller (the page) has already passed `requireAdmin`. Oldest first unless `newest` is asked for.
 */
export async function listPendingFlashcards(params: QueueParams): Promise<PendingQueue> {
  const known = params.category
    ? await db.category.findUnique({ where: { id: params.category }, select: { id: true } })
    : null;
  const categoryId = known?.id;
  const inCategory = categoryId === undefined ? {} : { categoryId };
  const order = params.sort === "newest" ? "desc" : "asc";

  const [cards, groups, pendingTotal] = await Promise.all([
    db.flashcard.findMany({
      where: { status: STATUS_OF[params.tab], ...inCategory },
      orderBy: [{ submittedAt: order }, { id: order }],
      select: {
        id: true,
        question: true,
        answer: true,
        submittedAt: true,
        category: { select: { name: true } },
        author: { select: { nickname: true } },
      },
    }),
    db.flashcard.groupBy({ by: ["status"], where: inCategory, _count: { _all: true } }),
    getPendingQueueCount(),
  ]);

  const count = (status: FlashcardStatus) => groups.find((group) => group.status === status)?._count._all ?? 0;
  return {
    rows: cards.map((card) => ({
      id: card.id,
      category: card.category.name,
      question: card.question,
      answerExcerpt: answerExcerpt(card.answer),
      author: card.author?.nickname ?? null,
      submittedAt: card.submittedAt,
    })),
    counts: { pending: count("PENDING"), approved: count("APPROVED"), rejected: count("REJECTED") },
    pendingTotal,
    category: categoryId,
  };
}
