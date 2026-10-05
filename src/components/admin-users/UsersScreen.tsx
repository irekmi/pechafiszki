import { NoMatch } from "@/components/library/LibraryEmpty";
import { Page, Stack } from "@/components/ui/Page";
import { ToastBoard } from "@/components/ui/ToastBoard";
import type { UsersPage } from "@/server/services/listUsers";
import { ADMIN_USERS_PATH, usersQuery, type UsersParams } from "@/server/services/usersParams";
import { UsersFilters } from "./UsersFilters";
import { UsersFooter } from "./UsersFooter";
import { UsersHead } from "./UsersHead";
import { UsersTable } from "./UsersTable";

/**
 * SCR-19 (`19-administracja-uzytkownicy.html`, no deviations). A search that matches nothing draws the
 * empty state under the filter bar. The mockup's closing sentence about the only administrator documents
 * the inactive button; it is not rendered.
 */
export function UsersScreen({ page, params }: { page: UsersPage; params: UsersParams }) {
  return (
    <Page>
      <UsersHead users={page.users} admins={page.admins} />
      <ToastBoard message="Użytkownik usunięty">
        <Stack>
          <UsersFilters key={usersQuery({ ...params, limit: undefined })} params={params} />
          {page.total === 0 ? (
            <NoMatch clearHref={ADMIN_USERS_PATH} title="Nie ma użytkowników pasujących do wyszukiwania" />
          ) : (
            <>
              <UsersTable rows={page.rows} />
              <UsersFooter params={params} shown={page.shown} total={page.total} />
            </>
          )}
        </Stack>
      </ToastBoard>
    </Page>
  );
}
