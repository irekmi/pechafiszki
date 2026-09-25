import { Prisma } from "@prisma/client";
import { foldText } from "@/domain/matchesQuery";
import type { LibraryParams } from "./libraryParams";

/**
 * SQL fragments of API-06. Aliases: `f` Flashcard, `c` Category, `p` the caller's CardProgress
 * (LEFT JOINed on the unique `(userId, flashcardId)` index, so a card with no row reads "new").
 */

/**
 * The marking the caller sees, as `know | repeat | unknown | new`. A card whose hidden week has
 * ended has returned to **Do powtórki** — this mirrors `expireHide` in `src/domain/hide.ts`
 * (DEC-04); the filter and the **Moja ocena** sort have to happen in the query, so the rule is
 * restated here and `tests/integration/SCR-08-library.test.ts` asserts the two agree.
 */
export function effectiveMark(now: Date): Prisma.Sql {
  return Prisma.sql`(CASE WHEN p."mark" IS NULL THEN 'new'
    WHEN p."hiddenUntil" IS NOT NULL AND p."hiddenUntil" <= ${now} THEN 'repeat'
    ELSE lower(p."mark"::text) END)`;
}

/** The hide date while the week is still running (DEC-11), otherwise null. */
export function liveHiddenUntil(now: Date): Prisma.Sql {
  return Prisma.sql`(CASE WHEN p."hiddenUntil" > ${now} THEN p."hiddenUntil" END)`;
}

/** `LIKE` metacharacters in the phrase are literals, not wildcards. */
function escapeLike(text: string): string {
  return text.replace(/[\\%_]/g, (char) => `\\${char}`);
}

/** The WHERE of the list and of its count: approved only (REQ-01), then each filter that is set. */
export function libraryWhere(params: LibraryParams, now: Date): Prisma.Sql {
  const parts = [Prisma.sql`f."status" = 'APPROVED'::"FlashcardStatus"`];
  if (params.category) parts.push(Prisma.sql`f."categoryId" = ${params.category}`);
  if (params.mark) parts.push(Prisma.sql`${effectiveMark(now)} = ${params.mark}`);
  if (params.query) {
    // DEC-49: the phrase is folded by the domain function, the columns by `fold_text` — the
    // expression the two GIN trigram indexes of the library_search_fold migration are built on.
    const pattern = `%${escapeLike(foldText(params.query))}%`;
    parts.push(
      Prisma.sql`(fold_text(f."question") LIKE ${pattern} OR fold_text(f."answer") LIKE ${pattern})`,
    );
  }
  return Prisma.join(parts, " AND ");
}

/** The four orders; ties always break on newest, then id, so paging is stable (DEC-50). */
export function libraryOrder(sort: LibraryParams["sort"], now: Date): Prisma.Sql {
  const newest = Prisma.sql`f."submittedAt" DESC, f."id" DESC`;
  switch (sort) {
    case "oldest":
      return Prisma.sql`f."submittedAt" ASC, f."id" ASC`;
    case "category":
      return Prisma.sql`c."position" ASC, ${newest}`;
    case "mark":
      return Prisma.sql`CASE ${effectiveMark(now)} WHEN 'unknown' THEN 0 WHEN 'repeat' THEN 1
        WHEN 'know' THEN 2 ELSE 3 END ASC, ${newest}`;
    default:
      return newest;
  }
}
