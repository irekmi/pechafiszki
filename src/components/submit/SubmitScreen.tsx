import { InfoIcon } from "@/components/ui/icons";
import { Notice } from "@/components/ui/Notice";
import { Page, PageHead, PageTitleGroup } from "@/components/ui/Page";
import { Muted, PageTitle } from "@/components/ui/Typography";
import type { CategoryRow } from "@/server/services/listCategories";
import { GuidanceCard } from "./GuidanceCard";
import { SubmitForm } from "./SubmitForm";

/** SCR-10 — `10-dodaj-fiszke.html`: the head, the form with its live preview, the queue notice and the guidance. */
export function SubmitScreen({ categories }: { categories: Pick<CategoryRow, "id" | "name">[] }) {
  return (
    <Page>
      <PageHead>
        <PageTitleGroup>
          <PageTitle>Dodaj fiszkę</PageTitle>
          <Muted>Twoja fiszka pojawi się we wspólnej puli po zatwierdzeniu przez administratora.</Muted>
        </PageTitleGroup>
      </PageHead>
      <SubmitForm
        categories={categories}
        aside={
          <>
            <Notice icon={<InfoIcon />}>
              Po wysłaniu fiszka trafia do kolejki administratora. Znajdziesz ją w „Moich fiszkach” ze statusem „Oczekuje”.
            </Notice>
            <GuidanceCard />
          </>
        }
      />
    </Page>
  );
}
