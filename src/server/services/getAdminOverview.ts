import { weekBounds } from "@/domain/week";
import { db } from "@/server/db";
import { adminListFlashcards } from "./adminListFlashcards";
import { oldestPendingSubmittedAt, rejectedWithReasonCount, weekDecisionStats, type WeekDecisions } from "./adminOverviewStats";
import { listCategories, type CategoryRow } from "./listCategories";

export type LatestSubmission = { id: number; category: string; question: string; author: string | null; submittedAt: Date };
export type LargestCategory = { name: string; count: number } | null;

export type AdminOverview = {
  pending: { count: number; oldestAt: Date | null };
  approved: number;
  rejected: number;
  rejectedWithReason: number;
  users: { total: number; admins: number };
  categories: { count: number; largest: LargestCategory };
  latest: LatestSubmission[];
  weekDecisions: WeekDecisions;
  newUsers: { nickname: string; createdAt: Date }[];
};

function largestOf(rows: CategoryRow[]): LargestCategory {
  if (rows.length === 0) return null;
  const top = rows.reduce((best, row) => ((row.flashcardCount ?? 0) > (best.flashcardCount ?? 0) ? row : best));
  return { name: top.name, count: top.flashcardCount ?? 0 };
}

/**
 * API-25 — SCR-15's dashboard. Every figure is computed on request (DEC-54, NFR-05); nothing is
 * stored. One call to `adminListFlashcards` supplies both the whole-pool status counts (`counts`,
 * unfiltered by construction) and the five newest pending rows in one pass; `listCategories(true)`
 * supplies the same per-category approved counts SCR-21 already reads. Neither is re-queried here.
 */
export async function getAdminOverview(): Promise<AdminOverview> {
  const [pendingPage, categories, oldestAt, rejectedWithReason, total, admins, weekDecisions, newUsers] =
    await Promise.all([
      adminListFlashcards({ status: "pending", sort: "newest", limit: 5 }),
      listCategories(true),
      oldestPendingSubmittedAt(),
      rejectedWithReasonCount(),
      db.user.count(),
      db.user.count({ where: { role: "ADMIN" } }),
      weekDecisionStats(weekBounds(new Date())),
      db.user.findMany({ orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 3, select: { nickname: true, createdAt: true } }),
    ]);

  return {
    pending: { count: pendingPage.counts.pending, oldestAt },
    approved: pendingPage.counts.approved,
    rejected: pendingPage.counts.rejected,
    rejectedWithReason,
    users: { total, admins },
    categories: { count: categories.rows.length, largest: largestOf(categories.rows) },
    latest: pendingPage.rows.map((row) => ({
      id: row.id,
      category: row.category,
      question: row.question,
      author: row.author,
      submittedAt: row.submittedAt,
    })),
    weekDecisions,
    newUsers,
  };
}
