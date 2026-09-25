import { Prisma } from "@prisma/client";
import { db } from "@/server/db";
import type { LibraryParams } from "./libraryParams";
import { libraryOrder, libraryWhere, effectiveMark, liveHiddenUntil } from "./libraryWhere";

export type LibraryMark = "know" | "repeat" | "unknown" | "new";

export type LibraryRow = {
  id: number;
  category: string;
  question: string;
  submittedAt: Date;
  author: string | null;
  mark: LibraryMark;
  hiddenUntil: Date | null;
};

export type LibraryPage = { rows: LibraryRow[]; shown: number; total: number };

/**
 * API-06 — the approved pool for the caller, filtered, sorted and capped at `params.limit`
 * (NFR-04), with the caller's marking and hide date on every row (DEC-11). Only `APPROVED` cards
 * are ever selected (REQ-01); the status test sits in `libraryWhere`, not in a component. The
 * caller's id is an argument, taken from the session by the page — never from the URL.
 *
 * Raw SQL, on purpose: Prisma cannot express the diacritic-folded search (DEC-49, an expression
 * index) or a sort on the caller's own marking (DEC-50) in one query. Every value is a bound
 * parameter.
 */
export async function listFlashcards(
  userId: number,
  params: LibraryParams,
  now: Date = new Date(),
): Promise<LibraryPage> {
  const join = Prisma.sql`LEFT JOIN "CardProgress" p ON p."flashcardId" = f."id" AND p."userId" = ${userId}`;
  const where = libraryWhere(params, now);

  const [rows, counted] = await Promise.all([
    db.$queryRaw<LibraryRow[]>`
      SELECT f."id", c."name" AS "category", f."question", f."submittedAt", u."nickname" AS "author",
             ${effectiveMark(now)} AS "mark", ${liveHiddenUntil(now)} AS "hiddenUntil"
      FROM "Flashcard" f
      JOIN "Category" c ON c."id" = f."categoryId"
      LEFT JOIN "User" u ON u."id" = f."authorId"
      ${join}
      WHERE ${where}
      ORDER BY ${libraryOrder(params.sort, now)}
      LIMIT ${params.limit}`,
    db.$queryRaw<{ total: number }[]>`
      SELECT count(*)::int AS "total" FROM "Flashcard" f ${join} WHERE ${where}`,
  ]);
  return { rows, shown: rows.length, total: counted[0]?.total ?? 0 };
}
