import { authorName } from "@/components/card-detail/detailFormat";
import { formatDate } from "@/components/study/formatDate";
import { Button, ButtonLink } from "@/components/ui/Button";
import { PageActions, PageHead, PageTitleGroup } from "@/components/ui/Page";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Muted, PageTitle } from "@/components/ui/Typography";
import type { FlashcardDetail } from "@/server/services/getFlashcard";
import { REVIEW_PATH } from "@/server/services/nextPendingAfter";
import type { QueuePosition } from "@/server/services/queueNeighbours";

type StepProps = { label: string; id: number | null };

/** A neighbour in the queue, or its inactive twin when the queue holds nothing else (States, row 2). */
function Step({ label, id }: StepProps) {
  return id === null ? (
    <Button size="sm" disabled>
      {label}
    </Button>
  ) : (
    <ButtonLink size="sm" href={`${REVIEW_PATH}/${id}`}>
      {label}
    </ButtonLink>
  );
}

/** SCR-17 elements 2-4: heading with its sub-line, **Poprzednie** / **Następne zgłoszenie**, the status. */
export function ReviewHead({ detail, position }: { detail: FlashcardDetail; position: QueuePosition | null }) {
  const { card, author } = detail;
  return (
    <PageHead>
      <PageTitleGroup>
        <PageTitle>Ocena fiszki</PageTitle>
        <Muted>{`Dodana przez ${authorName(author)} · zgłoszona ${formatDate(card.submittedAt)}`}</Muted>
      </PageTitleGroup>
      <PageActions>
        <Step label="Poprzednie zgłoszenie" id={position?.previousId ?? null} />
        <Step label="Następne zgłoszenie" id={position?.nextId ?? null} />
        <StatusBadge status={card.status} size="lg" />
      </PageActions>
    </PageHead>
  );
}
