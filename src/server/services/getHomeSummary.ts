import { countsAndShares } from "@/domain/counts";
import { countMemorisedInWeek, weekBounds } from "@/domain/week";
import type { FlashcardCountInput } from "@/domain/types";
import { db } from "@/server/db";
import { getPendingQueueCount } from "./getPendingQueueCount";

export type HomeCategory = { id: number; name: string; total: number; know: number; repeat: number };

export type HomeSummary = {
  nickname: string;
  poolTotal: number;
  counts: { know: number; repeat: number; unknown: number; new: number };
  shares: { know: number; repeat: number; unknown: number; new: number };
  memorisedThisWeek: number;
  weekStart: Date;
  weekEnd: Date;
  repeatCount: number;
  categories: HomeCategory[];
  own: { pending: number; approved: number; rejected: number };
  pendingQueue?: number;
};

/**
 * API-08 — everything SCR-05 shows at a glance. Every DEC-governed figure (the four counters and
 * their shares, DEC-10/DEC-53; the weekly count, DEC-02/DEC-06) is computed by `src/domain/`, never
 * re-derived here — this service only shapes the rows those functions read (CLAUDE.md §7).
 */
export async function getHomeSummary(
  userId: number,
  nickname: string,
  isAdmin: boolean,
): Promise<HomeSummary> {
  const [approved, ownFirstKnown, pending, approvedCount, rejected, categoryRows] = await Promise.all([
    db.flashcard.findMany({
      where: { status: "APPROVED" },
      select: { categoryId: true, progress: { where: { userId }, select: { mark: true } } },
    }),
    db.cardProgress.findMany({
      where: { userId, firstKnownAt: { not: null } },
      select: { firstKnownAt: true },
    }),
    db.flashcard.count({ where: { authorId: userId, status: "PENDING" } }),
    db.flashcard.count({ where: { authorId: userId, status: "APPROVED" } }),
    db.flashcard.count({ where: { authorId: userId, status: "REJECTED" } }),
    db.category.findMany({ orderBy: { position: "asc" }, select: { id: true, name: true } }),
  ]);

  const toInput = (rows: typeof approved): FlashcardCountInput[] =>
    rows.map((row) => ({ mark: row.progress[0]?.mark ?? null }));

  const pool = countsAndShares(toInput(approved));
  const now = new Date();
  const { start, end } = weekBounds(now);
  const memorisedThisWeek = countMemorisedInWeek(
    ownFirstKnown.map((row) => row.firstKnownAt),
    now,
  );

  const categories: HomeCategory[] = categoryRows.map((category) => {
    const cards = approved.filter((card) => card.categoryId === category.id);
    const { know, repeat } = countsAndShares(toInput(cards));
    return { id: category.id, name: category.name, total: cards.length, know, repeat };
  });

  return {
    nickname,
    poolTotal: approved.length,
    counts: { know: pool.know, repeat: pool.repeat, unknown: pool.unknown, new: pool.notStarted },
    shares: {
      know: pool.knowShare,
      repeat: pool.repeatShare,
      unknown: pool.unknownShare,
      new: pool.notStartedShare,
    },
    memorisedThisWeek,
    weekStart: start,
    weekEnd: end,
    repeatCount: pool.repeat,
    categories,
    own: { pending, approved: approvedCount, rejected },
    pendingQueue: isAdmin ? await getPendingQueueCount() : undefined,
  };
}
