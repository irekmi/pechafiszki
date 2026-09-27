import { Card, CardFoot } from "@/components/ui/Card";
import { Datalist, DatalistRow } from "@/components/ui/Datalist";
import { SectionTitle } from "@/components/ui/Typography";
import type { UserDetails } from "@/server/services/getUserDetails";

/** SCR-20 elements 7 and 8: submission counts by status, and the three progress totals — aggregates only, never a per-card row (ENT-05). */
export function CountsCard({ details: { submissions, progress } }: { details: UserDetails }) {
  return (
    <Card>
      <SectionTitle>Zgłoszenia</SectionTitle>
      <Datalist>
        <DatalistRow label="Oczekujące" value={submissions.pending} />
        <DatalistRow label="Zatwierdzone" value={submissions.approved} />
        <DatalistRow label="Odrzucone" value={submissions.rejected} />
      </Datalist>
      <CardFoot>
        <SectionTitle>Postęp w nauce</SectionTitle>
        <Datalist>
          <DatalistRow label="Umiem" value={progress.know} />
          <DatalistRow label="Do powtórki" value={progress.repeat} />
          <DatalistRow label="Nie umiem" value={progress.unknown} />
        </Datalist>
      </CardFoot>
    </Card>
  );
}
