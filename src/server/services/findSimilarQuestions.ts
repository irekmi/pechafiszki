import { Prisma } from "@prisma/client";
import { db } from "@/server/db";

export type SimilarQuestion = { id: number; question: string };

export const SIMILAR_LIMIT = 3;

type Subject = { id: number; categoryId: number; question: string };

/**
 * DEC-35 — the (at most) three approved questions in the same category whose text is most like this
 * one, by trigram, as a hint to the administrator; it never gates a decision. Raw SQL because a
 * trigram comparison has no Prisma form: `%` is pg_trgm's similarity operator (default threshold
 * 0.3) and `fold_text` is the expression ST-11's GIN trigram index is built on, which also makes the
 * comparison diacritic-insensitive. The question is a bound parameter, never spliced into the text.
 */
export async function findSimilarQuestions({ id, categoryId, question }: Subject): Promise<SimilarQuestion[]> {
  return db.$queryRaw<SimilarQuestion[]>(Prisma.sql`
    SELECT f."id", f."question"
    FROM "Flashcard" f
    WHERE f."status" = 'APPROVED'::"FlashcardStatus"
      AND f."categoryId" = ${categoryId}
      AND f."id" <> ${id}
      AND fold_text(f."question") % fold_text(${question})
    ORDER BY similarity(fold_text(f."question"), fold_text(${question})) DESC, f."id" ASC
    LIMIT ${SIMILAR_LIMIT}`);
}
