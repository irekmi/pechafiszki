import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardFoot, CardHead, CardTitle } from "@/components/ui/Card";
import { Row } from "@/components/ui/Page";
import { Muted } from "@/components/ui/Typography";
import { formatDate } from "./formatDate";

type AllHiddenProps = { categoryName: string | null; returnDate: Date | null };

/** SCR-06 "empty — all hidden": every card in the chosen category is hidden for its week (DEC-05). */
export function AllHidden({ categoryName, returnDate }: AllHiddenProps) {
  return (
    <Card tint>
      <CardHead>
        <CardTitle>Nic tu teraz do nauki</CardTitle>
        <Badge tone="hidden">Wszystkie ukryte na tydzień</Badge>
      </CardHead>
      <Muted>
        Wszystkie fiszki{" "}
        {categoryName ? (
          <>
            z kategorii <span className="font-bold">{categoryName}</span>{" "}
          </>
        ) : null}
        oceniłeś pięć razy „Umiem”, więc wrócą do sesji
        {returnDate ? ` po ${formatDate(returnDate)}` : ""}.
      </Muted>
      <CardFoot>
        <Row>
          <ButtonLink variant="primary" href="/start">
            Wybierz inną kategorię
          </ButtonLink>
          <ButtonLink href="/statystyki">Zobacz moje statystyki</ButtonLink>
        </Row>
      </CardFoot>
    </Card>
  );
}
