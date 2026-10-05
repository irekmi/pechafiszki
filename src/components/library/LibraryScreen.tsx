import { List } from "@/components/ui/ListItem";
import { Page, Stack } from "@/components/ui/Page";
import { libraryQuery, type LibraryParams } from "@/server/services/libraryParams";
import type { CategoryRow } from "@/server/services/listCategories";
import type { LibraryPage } from "@/server/services/listFlashcards";
import type { SessionFilters } from "@/server/services/sessionFilters";
import { EmptyPool, NoMatch } from "./LibraryEmpty";
import { LibraryFilters } from "./LibraryFilters";
import { LibraryFooter } from "./LibraryFooter";
import { LibraryHead } from "./LibraryHead";
import { LibraryRow } from "./LibraryRow";

type LibraryScreenProps = { page: LibraryPage; params: LibraryParams; categories: CategoryRow[] };

/** API-10 has no "Nie zaczęte" marking, so a `new` filter is left out of the session (SQ-11.1). */
function sessionFiltersOf(params: LibraryParams): SessionFilters {
  return {
    ...(params.category ? { category: params.category } : {}),
    ...(params.query ? { query: params.query } : {}),
    ...(params.mark && params.mark !== "new" ? { mark: params.mark } : {}),
  };
}

/**
 * SCR-08 — the approved pool as a filtered, sorted list (`08-biblioteka-fiszek.html`, DEV-01,
 * DEV-03), with both empty states. A row carries the current parameters to SCR-09, whose **Wróć do
 * listy** returns to them (DEC-51).
 */
export function LibraryScreen({ page, params, categories }: LibraryScreenProps) {
  const { rows, shown, total } = page;
  const narrowed = Boolean(params.query || params.category || params.mark);
  if (total === 0 && !narrowed) {
    return (
      <Page>
        <LibraryHead total={0} poolEmpty session={null} />
        <EmptyPool />
      </Page>
    );
  }
  const carry = libraryQuery(params);
  return (
    <Page>
      <LibraryHead total={total} session={total > 0 ? sessionFiltersOf(params) : null} />
      <Stack>
        <LibraryFilters key={libraryQuery({ ...params, limit: undefined })} categories={categories} params={params} />
        {total === 0 ? (
          <NoMatch />
        ) : (
          <>
            <List>
              {rows.map((row) => (
                <LibraryRow key={row.id} row={row} href={`/fiszki/${row.id}${carry}`} />
              ))}
            </List>
            <LibraryFooter params={params} shown={shown} total={total} />
          </>
        )}
      </Stack>
    </Page>
  );
}
