import { ContinueForm } from "@/components/summary/ContinueForm";
import { StudyShell } from "@/components/study/StudyShell";
import { Grid, Page, Stack } from "@/components/ui/Page";
import type { FlashcardDetail } from "@/server/services/getFlashcard";
import { AboutFlashcard } from "./AboutFlashcard";
import { DetailCard } from "./DetailCard";
import { DetailHead } from "./DetailHead";
import { MarkingCard } from "./MarkingCard";

type CardDetailScreenProps = { detail: FlashcardDetail; backHref: string };

/**
 * SCR-09 — one flashcard in full, ported from `09-szczegoly-fiszki.html` (DEV-02, DEV-04).
 * `StudyShell` supplies the toast "Zapisano ocenę" the marking buttons raise.
 */
export function CardDetailScreen({ detail, backHref }: CardDetailScreenProps) {
  return (
    <StudyShell cardKey={String(detail.card.id)}>
      <Page>
        <DetailHead detail={detail} backHref={backHref} />
        <Grid cols={2}>
          <DetailCard card={detail.card} />
          <Stack>
            <MarkingCard detail={detail} />
            <AboutFlashcard detail={detail} />
            <ContinueForm
              filters={{ category: detail.card.category.id }}
              variant="primary"
              label="Ucz się z tej kategorii"
              block
            />
          </Stack>
        </Grid>
      </Page>
    </StudyShell>
  );
}
