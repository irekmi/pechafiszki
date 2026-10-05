import { LibraryScreen } from "@/components/library/LibraryScreen";
import { requireUser } from "@/server/permissions";
import { parseLibraryParams } from "@/server/services/libraryParams";
import { listCategories } from "@/server/services/listCategories";
import { listFlashcards } from "@/server/services/listFlashcards";

type SearchParams = Record<string, string | string[] | undefined>;

/**
 * SCR-08 — the flashcard library (API-06). Any signed-in person; the session is re-checked here
 * (CLAUDE.md §8) and its user id, never a URL value, selects whose markings are joined in. Every
 * search parameter is validated by Zod and falls back to its default (DEC-51), so a hand-made URL
 * never reaches an error page.
 */
export default async function FiszkiPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const user = await requireUser();
  const params = parseLibraryParams(await searchParams);
  const [page, { rows: categories }] = await Promise.all([listFlashcards(user.id, params), listCategories()]);
  return <LibraryScreen page={page} params={params} categories={categories} />;
}
