import { Page } from "@/components/ui/Page";
import { Muted, PageTitle } from "@/components/ui/Typography";
import { requireAdmin } from "@/server/permissions";

/**
 * A minimal administration landing route. SCR-15 and the rest of the area are built in ST-14; this
 * file exists so AC-03.4 — a signed-in User at an administration address gets HTTP 403 — has an
 * address to be refused at. The guard is re-checked here as well as in the layout (CLAUDE.md §8).
 */
export default async function AdminOverviewPlaceholderPage() {
  await requireAdmin();
  return (
    <Page>
      <PageTitle>Administracja</PageTitle>
      <Muted className="mt-4">Przegląd administracyjny powstaje w kolejnym etapie.</Muted>
    </Page>
  );
}
