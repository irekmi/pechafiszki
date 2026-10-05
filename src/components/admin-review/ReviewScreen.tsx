import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Grid, Page, Stack } from "@/components/ui/Page";
import { QUEUE_PATH } from "@/server/services/adminQueueParams";
import type { FlashcardDetail } from "@/server/services/getFlashcard";
import type { AuthorRecord } from "@/server/services/getAuthorRecord";
import type { CategoryRow } from "@/server/services/listCategories";
import type { SimilarQuestion } from "@/server/services/findSimilarQuestions";
import type { QueuePosition } from "@/server/services/queueNeighbours";
import { DecisionPanel } from "./DecisionPanel";
import { ReviewHead } from "./ReviewHead";
import { ReviewPreview } from "./ReviewPreview";
import { SubmissionCard } from "./SubmissionCard";

type ReviewScreenProps = {
  detail: FlashcardDetail;
  /** `null` once the card is no longer pending — it has no place in the queue. */
  position: QueuePosition | null;
  categories: CategoryRow[];
  author: AuthorRecord | null;
  similar: SimilarQuestion[];
};

/** SCR-17, ported from `17-administracja-ocena-fiszki.html` (DEV-01, DEV-02). */
export function ReviewScreen({ detail, position, categories, author, similar }: ReviewScreenProps) {
  const { card } = detail;
  return (
    <Page>
      <Breadcrumb
        items={[
          { label: "Oczekujące", href: QUEUE_PATH },
          { label: position ? `Zgłoszenie ${position.position} z ${position.total}` : "Zgłoszenie" },
        ]}
      />
      <ReviewHead detail={detail} position={position} />
      <Grid cols={2}>
        <ReviewPreview card={card} />
        <Stack>
          <DecisionPanel
            id={card.id}
            categoryId={card.category.id}
            categories={categories.map(({ id, name }) => ({ id, name }))}
            decided={card.status !== "PENDING"}
          />
          <SubmissionCard submittedAt={card.submittedAt} author={author} similar={similar} />
        </Stack>
      </Grid>
    </Page>
  );
}
