import { ButtonLink } from "@/components/ui/Button";
import { PageActions, PageHead, PageTitleGroup } from "@/components/ui/Page";
import { Muted, PageTitle } from "@/components/ui/Typography";
import type { AdminStatusCounts } from "@/server/services/adminListFlashcards";
import { counterText } from "./counterText";

/** SCR-18 elements 1–3: the heading, the counter line and **Dodaj fiszkę** (→ SCR-10). */
export function AdminCardsHead({ counts }: { counts: AdminStatusCounts }) {
  return (
    <PageHead>
      <PageTitleGroup>
        <PageTitle>Wszystkie fiszki</PageTitle>
        <Muted>{counterText(counts)}</Muted>
      </PageTitleGroup>
      <PageActions>
        <ButtonLink href="/dodaj">Dodaj fiszkę</ButtonLink>
      </PageActions>
    </PageHead>
  );
}
