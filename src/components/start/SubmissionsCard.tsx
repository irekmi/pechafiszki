import { ButtonLink } from "@/components/ui/Button";
import { Card, CardFoot, CardHead } from "@/components/ui/Card";
import { Datalist, DatalistRow } from "@/components/ui/Datalist";
import type { HomeSummary } from "@/server/services/getHomeSummary";

/** SCR-05 element 9 — API-08 `own`; **Zobacz wszystkie** → SCR-11, **Dodaj fiszkę** → SCR-10. */
export function SubmissionsCard({ own }: { own: HomeSummary["own"] }) {
  return (
    <Card>
      <CardHead>
        <h2 className="font-display font-bold text-16 leading-title">Twoje fiszki</h2>
        <ButtonLink href="/moje-fiszki" size="sm">
          Zobacz wszystkie
        </ButtonLink>
      </CardHead>
      <Datalist>
        <DatalistRow label="Oczekujące na zatwierdzenie" value={own.pending} />
        <DatalistRow label="Zatwierdzone" value={own.approved} />
        <DatalistRow label="Odrzucone" value={own.rejected} />
      </Datalist>
      <CardFoot>
        <ButtonLink href="/dodaj" block>
          Dodaj fiszkę
        </ButtonLink>
      </CardFoot>
    </Card>
  );
}
