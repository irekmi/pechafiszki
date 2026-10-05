import { MarkBadge } from "@/components/library/MarkBadge";
import { formatDate } from "@/components/study/formatDate";
import { MarkButtons } from "@/components/study/MarkButtons";
import { Card, CardFoot } from "@/components/ui/Card";
import { Datalist, DatalistRow } from "@/components/ui/Datalist";
import { SectionTitle } from "@/components/ui/Typography";
import type { FlashcardDetail } from "@/server/services/getFlashcard";
import { knowTimes, libraryMark } from "./detailFormat";

/**
 * SCR-09 elements 8 and 9 — the three marking buttons (API-12, no session) with the current one
 * pressed, and the caller's own standing on the card (ENT-05). A card never marked shows none
 * pressed and "Nie zaczęte".
 */
export function MarkingCard({ detail }: { detail: FlashcardDetail }) {
  const { mark, knowCount, lastSeenAt } = detail;
  return (
    <Card>
      <SectionTitle>Twoja ocena</SectionTitle>
      <MarkButtons flashcardId={detail.card.id} selected={mark} />
      <CardFoot>
        <Datalist>
          <DatalistRow label="Aktualna ocena" value={<MarkBadge mark={libraryMark(mark)} />} />
          <DatalistRow label="Oceniona „Umiem”" value={knowTimes(knowCount)} />
          <DatalistRow label="Ostatnio widziana" value={lastSeenAt ? formatDate(lastSeenAt) : "—"} />
        </Datalist>
      </CardFoot>
    </Card>
  );
}
