import { authorName } from "@/components/card-detail/detailFormat";
import { formatDate } from "@/components/study/formatDate";
import { PageActions, PageHead, PageTitleGroup } from "@/components/ui/Page";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Muted, PageTitle } from "@/components/ui/Typography";
import type { FlashcardDetail } from "@/server/services/getFlashcard";

/** SCR-12 elements 2–4: the heading, the sub-line and the status badge. */
export function EditHead({ detail }: { detail: FlashcardDetail }) {
  const { card, author } = detail;
  return (
    <PageHead>
      <PageTitleGroup>
        <PageTitle>Edytuj fiszkę</PageTitle>
        <Muted>{`Dodana przez ${authorName(author)} · zgłoszona ${formatDate(card.submittedAt)}`}</Muted>
      </PageTitleGroup>
      <PageActions>
        <StatusBadge status={card.status} size="lg" />
      </PageActions>
    </PageHead>
  );
}
