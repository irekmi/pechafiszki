import { PageHead, PageTitleGroup } from "@/components/ui/Page";
import { Muted, PageTitle } from "@/components/ui/Typography";
import { pluralPl } from "@/components/summary/pluralPl";

/** SCR-16 element 1 — "Fiszki oczekujące" and how many are waiting (the whole queue, whatever the filter). */
export function QueueHead({ pendingTotal }: { pendingTotal: number }) {
  const noun = pluralPl(pendingTotal, "fiszka czeka", "fiszki czekają", "fiszek czeka");
  return (
    <PageHead>
      <PageTitleGroup>
        <PageTitle>Fiszki oczekujące</PageTitle>
        <Muted>{pendingTotal} {noun} na zatwierdzenie</Muted>
      </PageTitleGroup>
    </PageHead>
  );
}
