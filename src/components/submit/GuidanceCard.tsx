import { Card } from "@/components/ui/Card";
import { Datalist, DatalistRow } from "@/components/ui/Datalist";
import { SectionTitle } from "@/components/ui/Typography";

/** SCR-10 element 9 — static copy. */
export function GuidanceCard() {
  return (
    <Card>
      <SectionTitle>Jak wygląda dobra fiszka</SectionTitle>
      <Datalist>
        <DatalistRow label="Pytanie" value="jedno zagadnienie" />
        <DatalistRow label="Odpowiedź" value="3–5 zdań" />
        <DatalistRow label="Kod" value="najkrótszy, który pokazuje sens" />
      </Datalist>
    </Card>
  );
}
