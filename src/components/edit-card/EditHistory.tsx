import { authorName } from "@/components/card-detail/detailFormat";
import { formatDate } from "@/components/study/formatDate";
import { Card } from "@/components/ui/Card";
import { Datalist, DatalistRow } from "@/components/ui/Datalist";
import { SectionTitle } from "@/components/ui/Typography";
import type { LatestDecision } from "@/server/services/getEditCard";

type EditHistoryProps = { submittedAt: Date; latest: LatestDecision | null };

/**
 * SCR-12 element 13 — submitted, decided and by whom, from the latest Moderation Decision. The
 * decision rows stay after a resubmission (DEC-31) and are omitted for a card never decided.
 */
export function EditHistory({ submittedAt, latest }: EditHistoryProps) {
  return (
    <Card>
      <SectionTitle>Historia</SectionTitle>
      <Datalist>
        <DatalistRow label="Zgłoszona" value={formatDate(submittedAt)} />
        {latest ? (
          <>
            <DatalistRow
              label={latest.decision === "REJECTED" ? "Odrzucona" : "Zatwierdzona"}
              value={formatDate(latest.decidedAt)}
            />
            <DatalistRow label="Decyzję podjął" value={authorName(latest.decidedBy)} />
          </>
        ) : null}
      </Datalist>
    </Card>
  );
}
