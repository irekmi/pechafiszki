import { db } from "@/server/db";
import { buildBreakdown } from "./statisticsBreakdown";
import { pickWeek } from "./statisticsWeeks";

export type WeekOption = "current" | "previous";

export type StatsCategory = {
  id: number;
  name: string;
  know: number;
  repeat: number;
  unknown: number;
  new: number;
  total: number;
  percent: number;
};

export type Statistics =
  | { hasProgress: false; poolTotal: number }
  | {
      hasProgress: true;
      poolTotal: number;
      counts: { know: number; repeat: number; unknown: number; new: number };
      shares: { know: number; repeat: number; unknown: number; new: number };
      week: WeekOption;
      memorised: number;
      weekStart: Date;
      weekEnd: Date;
      previousWeek: number;
      hiddenNow: number;
      byCategory: StatsCategory[];
    };

/**
 * API-09 — every figure of SCR-13, computed on request from ENT-05/ENT-06 (DEC-54, NFR-05). Every
 * DEC-governed number comes from `src/domain/` via `buildBreakdown`/`pickWeek`, never re-derived
 * here (CLAUDE.md §7). Scoped by `userId` alone, never by `sessionId`, so a marking given outside a
 * session (SCR-09) still counts (AQ-001, AC-21.13).
 */
export async function getStatistics(userId: number, week: WeekOption): Promise<Statistics> {
  const [poolTotal, ownProgress] = await Promise.all([
    db.flashcard.count({ where: { status: "APPROVED" } }),
    db.cardProgress.findMany({ where: { userId }, select: { firstKnownAt: true } }),
  ]);
  if (ownProgress.length === 0) return { hasProgress: false, poolTotal };

  const [approved, categories] = await Promise.all([
    db.flashcard.findMany({
      where: { status: "APPROVED" },
      select: {
        categoryId: true,
        progress: { where: { userId }, select: { mark: true, knowCount: true, hiddenUntil: true, firstKnownAt: true } },
      },
    }),
    db.category.findMany({ orderBy: { position: "asc" }, select: { id: true, name: true } }),
  ]);

  const now = new Date();
  const { pool, hiddenNow, byCategory } = buildBreakdown(approved, categories, now);
  const weekly = pickWeek(
    ownProgress.map((row) => row.firstKnownAt),
    week,
    now,
  );

  return {
    hasProgress: true,
    poolTotal,
    counts: { know: pool.know, repeat: pool.repeat, unknown: pool.unknown, new: pool.notStarted },
    shares: { know: pool.knowShare, repeat: pool.repeatShare, unknown: pool.unknownShare, new: pool.notStartedShare },
    week,
    hiddenNow,
    byCategory,
    ...weekly,
  };
}
