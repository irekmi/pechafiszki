import { formatDate } from "@/components/study/formatDate";
import { Card } from "@/components/ui/Card";
import { Datalist, DatalistRow } from "@/components/ui/Datalist";
import { SectionTitle } from "@/components/ui/Typography";
import type { FlashcardDetail } from "@/server/services/getFlashcard";
import { authorName } from "./detailFormat";

const NOT_APPLICABLE = "nie dotyczy";

/** SCR-09 element 10 — the tinted card. "Ukryta do" and an unpublished card's date read "nie dotyczy". */
export function AboutFlashcard({ detail }: { detail: FlashcardDetail }) {
  const { card, author, hiddenUntil } = detail;
  return (
    <Card tint>
      <SectionTitle>O fiszce</SectionTitle>
      <Datalist>
        <DatalistRow label="Kategoria" value={card.category.name} />
        <DatalistRow label="Autor" value={authorName(author)} />
        <DatalistRow label="Opublikowana" value={card.publishedAt ? formatDate(card.publishedAt) : NOT_APPLICABLE} />
        <DatalistRow label="Ukryta do" value={hiddenUntil ? formatDate(hiddenUntil) : NOT_APPLICABLE} />
      </Datalist>
    </Card>
  );
}
