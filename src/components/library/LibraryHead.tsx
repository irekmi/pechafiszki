import { ButtonLink } from "@/components/ui/Button";
import { PageActions, PageHead, PageTitleGroup } from "@/components/ui/Page";
import { Muted, PageTitle } from "@/components/ui/Typography";
import { ContinueForm } from "@/components/summary/ContinueForm";
import { pluralPl } from "@/components/summary/pluralPl";
import type { SessionFilters } from "@/server/services/sessionFilters";

type LibraryHeadProps = {
  total: number;
  /** The empty-pool screen: "0 fiszek", and no actions. */
  poolEmpty?: boolean;
  /** What **Ucz się z tych fiszek** sends to API-10; `null` hides the button (nothing to study). */
  session: SessionFilters | null;
};

/** SCR-08 elements 1–4: the title, the counter of the filtered set, and both actions. */
export function LibraryHead({ total, poolEmpty, session }: LibraryHeadProps) {
  const counter = poolEmpty
    ? "0 fiszek"
    : `${total} ${pluralPl(total, "fiszka spełnia", "fiszki spełniają", "fiszek spełniają")} wybrane filtry`;
  return (
    <PageHead>
      <PageTitleGroup>
        <PageTitle>Fiszki</PageTitle>
        <Muted>{counter}</Muted>
      </PageTitleGroup>
      {poolEmpty ? null : (
        <PageActions>
          <ButtonLink href="/dodaj">Dodaj fiszkę</ButtonLink>
          {session ? <ContinueForm filters={session} variant="primary" label="Ucz się z tych fiszek" /> : null}
        </PageActions>
      )}
    </PageHead>
  );
}
