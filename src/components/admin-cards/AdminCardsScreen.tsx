import { NoMatch } from "@/components/library/LibraryEmpty";
import { Page, Stack } from "@/components/ui/Page";
import { ADMIN_CARDS_PATH } from "@/server/services/adminCardsPath";
import { adminCardsQuery, type AdminCardsParams } from "@/server/services/adminCardsParams";
import type { AdminCardsPage } from "@/server/services/adminListFlashcards";
import type { CategoryRow } from "@/server/services/listCategories";
import { AdminCardsBoard } from "./AdminCardsBoard";
import { AdminCardsFilters } from "./AdminCardsFilters";
import { AdminCardsFooter } from "./AdminCardsFooter";
import { AdminCardsHead } from "./AdminCardsHead";
import { AdminCardsTable } from "./AdminCardsTable";

type AdminCardsScreenProps = { page: AdminCardsPage; params: AdminCardsParams; categories: CategoryRow[] };

/**
 * SCR-18 (`18-administracja-wszystkie-fiszki.html`, DEV-01, DEV-03). Filters that match nothing, and a
 * database with no flashcard at all, draw the same empty state under the filter bar; the counter then
 * reads what the pool holds (0 for an empty one).
 */
export function AdminCardsScreen({ page, params, categories }: AdminCardsScreenProps) {
  return (
    <Page>
      <AdminCardsHead counts={page.counts} />
      <AdminCardsBoard>
        <Stack>
          <AdminCardsFilters key={adminCardsQuery({ ...params, limit: undefined })} categories={categories} params={params} />
          {page.total === 0 ? (
            <NoMatch clearHref={ADMIN_CARDS_PATH} />
          ) : (
            <>
              <AdminCardsTable rows={page.rows} />
              <AdminCardsFooter params={params} shown={page.shown} total={page.total} />
            </>
          )}
        </Stack>
      </AdminCardsBoard>
    </Page>
  );
}
