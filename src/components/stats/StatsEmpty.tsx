import { Button, ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatsArt } from "@/components/ui/EmptyArt";
import { Page, PageHead, PageTitleGroup } from "@/components/ui/Page";
import { Muted, PageTitle } from "@/components/ui/Typography";
import { startSessionAction } from "@/server/actions/startSession";
import { poolCountPhrase } from "./subline";

/** `13-moje-statystyki-pusty.html` — no `CardProgress` row at all (AC-21.7); tiles and table are absent. */
export function StatsEmpty({ poolTotal }: { poolTotal: number }) {
  return (
    <Page narrow>
      <PageHead>
        <PageTitleGroup>
          <PageTitle>Moje statystyki</PageTitle>
          <Muted>Pula liczy {poolCountPhrase(poolTotal)}</Muted>
        </PageTitleGroup>
      </PageHead>
      <EmptyState
        art={<StatsArt />}
        title="Zacznij naukę, aby zobaczyć statystyki"
        text="Liczby pojawią się tutaj po pierwszej ocenie fiszki. Zobaczysz, ile już umiesz, co czeka na powtórkę i ile zapamiętałeś w tym tygodniu."
        actions={
          <>
            <form action={startSessionAction}>
              <Button type="submit" variant="primary" size="lg">
                Zacznij naukę
              </Button>
            </form>
            <ButtonLink href="/fiszki">Przeglądaj wszystkie fiszki</ButtonLink>
          </>
        }
      />
    </Page>
  );
}
