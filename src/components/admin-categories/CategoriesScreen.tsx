import { pluralPl } from "@/components/summary/pluralPl";
import { EmptyState } from "@/components/ui/EmptyState";
import { Page, PageHead, PageTitleGroup, Stack } from "@/components/ui/Page";
import { ToastBoard } from "@/components/ui/ToastBoard";
import { Muted, PageTitle } from "@/components/ui/Typography";
import type { CategoryRow } from "@/server/services/listCategories";
import { AddCategoryForm } from "./AddCategoryForm";
import { CategoriesTable } from "./CategoriesTable";

/**
 * SCR-21 (`21-administracja-kategorie.html`, DEV-01). No paging — API-26 lists every row. `ToastBoard`
 * carries no fixed `message`: three different outcomes (add / reorder / delete) each pass their own
 * text to `notify(text)`.
 */
export function CategoriesScreen({ rows }: { rows: CategoryRow[] }) {
  return (
    <Page narrow>
      <PageHead>
        <PageTitleGroup>
          <PageTitle>Kategorie</PageTitle>
          <Muted>
            {`${rows.length} ${pluralPl(rows.length, "kategoria", "kategorie", "kategorii")} · `}
            kolejność decyduje o tym, jak widzą je uczący się
          </Muted>
        </PageTitleGroup>
      </PageHead>
      <ToastBoard>
        <Stack>
          <AddCategoryForm />
          {rows.length === 0 ? (
            <EmptyState inline title="Nie ma jeszcze kategorii. Dodaj pierwszą." />
          ) : (
            <CategoriesTable rows={rows} />
          )}
        </Stack>
      </ToastBoard>
    </Page>
  );
}
