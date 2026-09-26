import type { Metadata } from "next";
import { ReviewScreen } from "@/components/admin-review/ReviewScreen";
import { refuseNotFound, requireAdmin } from "@/server/permissions";
import { parseCardId } from "@/server/services/cardId";
import { findSimilarQuestions } from "@/server/services/findSimilarQuestions";
import { getAuthorRecord } from "@/server/services/getAuthorRecord";
import { getFlashcard } from "@/server/services/getFlashcard";
import { listCategories } from "@/server/services/listCategories";
import { listPendingFlashcards } from "@/server/services/listPendingFlashcards";
import { queueNeighbours } from "@/server/services/queueNeighbours";

export const metadata: Metadata = {
  title: "Administracja — ocena fiszki — Fiszki na rozmowy rekrutacyjne",
};

/**
 * SCR-17 — one submission in full (API-07), its place in the queue (API-19), the categories (API-26)
 * and the advisory hints of DEC-35 / DEC-36. Administrator only, re-checked here as well as in the
 * layout (CLAUDE.md §8). A malformed and a missing id both end in SCR-22's 404 variant.
 */
export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const id = parseCardId((await params).id);
  if (id === null) refuseNotFound();

  const detail = await getFlashcard(admin, id);
  if (!detail) refuseNotFound();

  const [queue, categories, author, similar] = await Promise.all([
    listPendingFlashcards({ tab: "pending", sort: "oldest" }),
    listCategories(),
    getAuthorRecord(id),
    findSimilarQuestions({ id, categoryId: detail.card.category.id, question: detail.card.question }),
  ]);
  return (
    <ReviewScreen
      detail={detail}
      position={queueNeighbours(queue.rows.map((row) => row.id), id)}
      categories={categories.rows}
      author={author}
      similar={similar}
    />
  );
}
