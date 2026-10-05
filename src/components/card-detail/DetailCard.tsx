import { Badge } from "@/components/ui/Badge";
import { Code } from "@/components/ui/Code";
import { Flashcard } from "@/components/ui/Flashcard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { FlashcardDetail } from "@/server/services/getFlashcard";

/** SCR-09 element 7 — the static card; the code example is plain mono text (DEV-02). */
export function DetailCard({ card }: { card: FlashcardDetail["card"] }) {
  return (
    <Flashcard
      variant="static"
      badges={
        <>
          <Badge tone="category">{card.category.name}</Badge>
          <StatusBadge status={card.status} />
        </>
      }
      question={card.question}
      answer={card.answer}
      example={card.codeExample ? <Code>{card.codeExample}</Code> : undefined}
    />
  );
}
