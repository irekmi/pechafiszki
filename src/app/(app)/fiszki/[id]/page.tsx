import { CardDetailScreen } from "@/components/card-detail/CardDetailScreen";
import { refuseNotFound, requireUser } from "@/server/permissions";
import { parseCardId } from "@/server/services/cardId";
import { getFlashcard } from "@/server/services/getFlashcard";
import { libraryQuery, parseLibraryParams } from "@/server/services/libraryParams";

type SearchParams = Record<string, string | string[] | undefined>;

/**
 * SCR-09 — one flashcard in full (API-07). Any signed-in person may open an approved card; a
 * pending or rejected one opens only for its author and an Administrator. A missing id, a malformed
 * id and a card the caller may not read all end in the same `refuseNotFound()` — SCR-22's 404
 * variant, indistinguishable from each other (DEC-57). **Wróć do listy** carries the library filters
 * this address arrived with, parsed like SCR-08 parses them (DEC-51).
 */
export default async function FlashcardPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const user = await requireUser();
  const id = parseCardId((await params).id);
  if (id === null) refuseNotFound();

  const detail = await getFlashcard(user, id);
  if (!detail) refuseNotFound();

  const backHref = `/fiszki${libraryQuery(parseLibraryParams(await searchParams))}`;
  return <CardDetailScreen detail={detail} backHref={backHref} />;
}
