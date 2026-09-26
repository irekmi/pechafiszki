import { Badge } from "@/components/ui/Badge";
import { Code } from "@/components/ui/Code";
import { Flashcard } from "@/components/ui/Flashcard";
import { Hint } from "@/components/ui/Typography";
import type { FlashcardDetail } from "@/server/services/getFlashcard";

/** SCR-17 element 5 — the card as a learner would see it in a session; the code is plain mono text (DEV-02). */
export function ReviewPreview({ card }: { card: FlashcardDetail["card"] }) {
  return (
    <Flashcard
      variant="static"
      badges={
        <>
          <Badge tone="category">{card.category.name}</Badge>
          <Hint>Podgląd fiszki w sesji</Hint>
        </>
      }
      question={card.question}
      answer={card.answer}
      example={card.codeExample ? <Code>{card.codeExample}</Code> : undefined}
    />
  );
}
