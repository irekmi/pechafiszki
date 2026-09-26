import { Prisma, type FlashcardStatus } from "@prisma/client";
import { db } from "@/server/db";
import { answerExcerpt } from "./answerExcerpt";
import type { AdminCardsParams } from "./adminCardsParams";
import { foldedSearch } from "./libraryWhere";

export type AdminCardRow = {
  id: number;
  category: string;
  question: string;
  /** The first ~80 characters of the answer. */
  excerpt: string;
  /** The latest rejection reason of a REJECTED card; `null` for any other status (or no recorded reason). */
  reason: string | null;
  status: FlashcardStatus;
  author: string | null;
  submittedAt: Date;
};

export type AdminStatusCounts = { approved: number; pending: number; rejected: number };
export type AdminCardsPage = { rows: AdminCardRow[]; shown: number; total: number; counts: AdminStatusCounts };

type RawRow = Omit<AdminCardRow, "excerpt"> & { answer: string };

const STATUS = {
  pending: Prisma.sql`'PENDING'::"FlashcardStatus"`,
  approved: Prisma.sql`'APPROVED'::"FlashcardStatus"`,
  rejected: Prisma.sql`'REJECTED'::"FlashcardStatus"`,
} as const;

/** Every filter that is set, AND-ed; aliases `f` Flashcard. No filter means every card of every status. */
function where(params: AdminCardsParams): Prisma.Sql {
  const parts = [Prisma.sql`TRUE`];
  if (params.status) parts.push(Prisma.sql`f."status" = ${STATUS[params.status]}`);
  if (params.category) parts.push(Prisma.sql`f."categoryId" = ${params.category}`);
  if (params.query) parts.push(foldedSearch(params.query));
  return Prisma.join(parts, " AND ");
}

/** The four orders. `author` is the nickname, case-insensitively, deleted authors last; ties break on newest, then id (DEC-50). */
function order(sort: AdminCardsParams["sort"]): Prisma.Sql {
  const newest = Prisma.sql`f."submittedAt" DESC, f."id" DESC`;
  switch (sort) {
    case "oldest":
      return Prisma.sql`f."submittedAt" ASC, f."id" ASC`;
    case "category":
      return Prisma.sql`c."position" ASC, ${newest}`;
    case "author":
      return Prisma.sql`lower(u."nickname") ASC NULLS LAST, ${newest}`;
    default:
      return newest;
  }
}

/**
 * API-24 — every flashcard of every status as a management table: filtered, sorted and capped in the
 * query (NFR-04, DEC-48), never in memory. `counts` are the whole pool's three statuses (the heading
 * sums to the database), `total` is what the filters match (the "Pokazano N z M" counter). A rejected
 * row carries its latest rejection reason. The caller (the page) has passed `requireAdmin`.
 *
 * Raw SQL, on purpose: Prisma cannot express the diacritic-folded search (DEC-49, an expression index)
 * or a sort by the joined nickname with NULLS LAST beside a LATERAL "latest reason" in one statement.
 * Every value is a bound parameter.
 */
export async function adminListFlashcards(params: AdminCardsParams): Promise<AdminCardsPage> {
  const filter = where(params);
  const [rows, counted, groups] = await Promise.all([
    db.$queryRaw<RawRow[]>`
      SELECT f."id", c."name" AS "category", f."question", f."answer", f."status", f."submittedAt",
             u."nickname" AS "author", d."reason"
      FROM "Flashcard" f
      JOIN "Category" c ON c."id" = f."categoryId"
      LEFT JOIN "User" u ON u."id" = f."authorId"
      LEFT JOIN LATERAL (
        SELECT m."reason" FROM "ModerationDecision" m
        WHERE m."flashcardId" = f."id" AND m."decision" = 'REJECTED'::"Decision"
        ORDER BY m."decidedAt" DESC, m."id" DESC LIMIT 1
      ) d ON f."status" = 'REJECTED'::"FlashcardStatus"
      WHERE ${filter}
      ORDER BY ${order(params.sort)}
      LIMIT ${params.limit}`,
    db.$queryRaw<{ total: number }[]>`SELECT count(*)::int AS "total" FROM "Flashcard" f WHERE ${filter}`,
    db.flashcard.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  const count = (status: FlashcardStatus) => groups.find((group) => group.status === status)?._count._all ?? 0;
  return {
    rows: rows.map(({ answer, ...row }) => ({ ...row, excerpt: answerExcerpt(answer) })),
    shown: rows.length,
    total: counted[0]?.total ?? 0,
    counts: { approved: count("APPROVED"), pending: count("PENDING"), rejected: count("REJECTED") },
  };
}
