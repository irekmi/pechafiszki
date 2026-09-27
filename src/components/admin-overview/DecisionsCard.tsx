import { Card, CardHead, CardTitle } from "@/components/ui/Card";
import { Datalist, DatalistRow } from "@/components/ui/Datalist";
import { formatDecisionDays } from "@/domain/decisionTurnaround";
import type { WeekDecisions } from "@/server/services/adminOverviewStats";

/** SCR-15 element 8 — `weekDecisions` (DEC-55); zeros and "—" for an empty week. */
export function DecisionsCard({ weekDecisions }: { weekDecisions: WeekDecisions }) {
  return (
    <Card>
      <CardHead>
        <CardTitle>Decyzje w tym tygodniu</CardTitle>
      </CardHead>
      <Datalist>
        <DatalistRow label="Zatwierdzone" value={weekDecisions.approved} />
        <DatalistRow label="Odrzucone" value={weekDecisions.rejected} />
        <DatalistRow label="Średni czas decyzji" value={formatDecisionDays(weekDecisions.averageDays)} />
      </Datalist>
    </Card>
  );
}
