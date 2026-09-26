import { ButtonLink } from "@/components/ui/Button";
import { PageActions, PageHead, PageTitleGroup } from "@/components/ui/Page";
import { Muted, PageTitle } from "@/components/ui/Typography";
import type { MyCardsCounts } from "@/server/services/listMyFlashcards";
import { myCardsSubline } from "./subline";

/** SCR-11 elements 1–3: the title, the sub-line from API-15 `counts`, and **Dodaj fiszkę**. */
export function MyCardsHead({ counts, withAction }: { counts: MyCardsCounts; withAction: boolean }) {
  return (
    <PageHead>
      <PageTitleGroup>
        <PageTitle>Moje fiszki</PageTitle>
        <Muted>{myCardsSubline(counts)}</Muted>
      </PageTitleGroup>
      {withAction ? (
        <PageActions>
          <ButtonLink href="/dodaj" variant="primary">
            Dodaj fiszkę
          </ButtonLink>
        </PageActions>
      ) : null}
    </PageHead>
  );
}
