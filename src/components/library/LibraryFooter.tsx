import { PagingFooter } from "@/components/ui/PagingFooter";
import { libraryQuery, LIBRARY_MAX_LIMIT, LIBRARY_PAGE_SIZE, type LibraryParams } from "@/server/services/libraryParams";

type LibraryFooterProps = { params: LibraryParams; shown: number; total: number };

/** SCR-08 elements 12 and 13: "Pokazano N z M fiszek" and **Pokaż więcej**, which raises `limit` by 20 (DEC-48). */
export function LibraryFooter({ params, shown, total }: LibraryFooterProps) {
  const more = shown < total && params.limit < LIBRARY_MAX_LIMIT;
  const next = { ...params, limit: params.limit + LIBRARY_PAGE_SIZE };
  return <PagingFooter shown={shown} total={total} moreHref={more ? `/fiszki${libraryQuery(next)}` : null} />;
}
