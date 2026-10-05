import { countsAndShares } from "@/domain/counts";
import { expireHide, isHidden } from "@/domain/hide";
import type { FlashcardCountInput, Mark, ProgressRecord } from "@/domain/types";
import type { StatsCategory } from "./getStatistics";

type RawProgress = { mark: Mark; knowCount: number; hiddenUntil: Date | null; firstKnownAt: Date | null };
export type ApprovedCard = { categoryId: number; progress: RawProgress[] };
export type CategoryRow = { id: number; name: string };

function toRecord(raw: RawProgress): ProgressRecord {
  return { mark: raw.mark, knowCount: raw.knowCount, hiddenUntil: raw.hiddenUntil, firstKnownAt: raw.firstKnownAt };
}

/**
 * The pool's tiles/shares, the per-category rows and "ukryte teraz" — all from the *effective*
 * marking (`expireHide`, DEC-04) and the still-hidden check (`isHidden`, DEC-10), never the raw
 * stored `mark`. `getHomeSummary` (ST-07) does not do this yet (ISS-08); this service does not
 * repeat that gap.
 */
export function buildBreakdown(approved: ApprovedCard[], categories: CategoryRow[], now: Date) {
  const rows = approved.map((card) => {
    const raw = card.progress[0] ?? null;
    return {
      categoryId: card.categoryId,
      hidden: raw !== null && isHidden(toRecord(raw), now),
      mark: raw !== null ? expireHide(toRecord(raw), now).mark : null,
    };
  });

  const toInput = (list: typeof rows): FlashcardCountInput[] => list.map((row) => ({ mark: row.mark }));
  const pool = countsAndShares(toInput(rows));
  const hiddenNow = rows.filter((row) => row.hidden).length;

  const byCategory: StatsCategory[] = categories.map((category) => {
    const own = rows.filter((row) => row.categoryId === category.id);
    const c = countsAndShares(toInput(own));
    return {
      id: category.id,
      name: category.name,
      know: c.know,
      repeat: c.repeat,
      unknown: c.unknown,
      new: c.notStarted,
      total: own.length,
      percent: c.knowShare,
    };
  });

  return { pool, hiddenNow, byCategory };
}
