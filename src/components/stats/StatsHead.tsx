import { Button } from "@/components/ui/Button";
import { PageActions, PageHead, PageTitleGroup } from "@/components/ui/Page";
import { TextLink } from "@/components/ui/TextLink";
import { Muted, PageTitle } from "@/components/ui/Typography";
import { startSessionAction } from "@/server/actions/startSession";
import { poolCountPhrase } from "./subline";

function todayInWarsaw(): string {
  return new Date().toLocaleDateString("pl-PL", { timeZone: "Europe/Warsaw", day: "numeric", month: "long", year: "numeric" });
}

/** SCR-13 elements 1–4: heading, sub-line and both header actions. */
export function StatsHead({ poolTotal }: { poolTotal: number }) {
  return (
    <PageHead>
      <PageTitleGroup>
        <PageTitle>Moje statystyki</PageTitle>
        <Muted>
          Stan na {todayInWarsaw()} · pula liczy {poolCountPhrase(poolTotal)}
        </Muted>
      </PageTitleGroup>
      <PageActions>
        <TextLink href="/fiszki">Przeglądaj wszystkie fiszki</TextLink>
        <form action={startSessionAction}>
          <Button type="submit" variant="primary">
            Zacznij naukę
          </Button>
        </form>
      </PageActions>
    </PageHead>
  );
}
