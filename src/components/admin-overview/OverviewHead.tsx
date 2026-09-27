import { pluralPl } from "@/components/summary/pluralPl";
import { ButtonLink } from "@/components/ui/Button";
import { PageActions, PageHead, PageTitleGroup } from "@/components/ui/Page";
import { Muted, PageTitle } from "@/components/ui/Typography";
import { QUEUE_PATH } from "@/server/services/adminQueueParams";
import type { AdminOverview } from "@/server/services/getAdminOverview";
import { daysSince } from "./daysSince";

/** SCR-15 elements 3, 4 and 10 — the heading, its sub-line and the two head actions. */
export function OverviewHead({ pending }: { pending: AdminOverview["pending"] }) {
  const days = pending.oldestAt ? daysSince(pending.oldestAt) : 0;
  const subline =
    pending.count === 0
      ? "Nic nie czeka na zatwierdzenie."
      : `${pending.count} ${pluralPl(pending.count, "fiszka czeka", "fiszki czekają", "fiszek czeka")} ` +
        `na decyzję, najstarsza od ${days} ${pluralPl(days, "dnia", "dni", "dni")}.`;
  return (
    <PageHead>
      <PageTitleGroup>
        <PageTitle>Administracja</PageTitle>
        <Muted>{subline}</Muted>
      </PageTitleGroup>
      <PageActions>
        <ButtonLink href="/">Wróć do nauki</ButtonLink>
        <ButtonLink href={QUEUE_PATH} variant="primary">
          Przejdź do kolejki
        </ButtonLink>
      </PageActions>
    </PageHead>
  );
}
