import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Flashcard } from "@/components/ui/Flashcard";
import { SectionTitle } from "@/components/ui/Typography";

type SubmitPreviewProps = { category?: string; question: string; answer: string };

const QUESTION_PLACEHOLDER = "np. Do czego służy useMemo i kiedy go nie używać?";
const ANSWER_PLACEHOLDER = "Odpowiedź pojawi się tutaj, gdy wypełnisz pole „Odpowiedź”.";

/**
 * SCR-10 element 7 — the card as a session will draw it. It is the shared `Flashcard` (variant
 * `preview`), so the preview cannot drift from SCR-06; the values are plain text, escaped by React
 * (DEV-03). Only the three values the spec names are shown, not the code example.
 */
export function SubmitPreview({ category, question, answer }: SubmitPreviewProps) {
  return (
    <Card tint>
      <SectionTitle>Podgląd fiszki w sesji</SectionTitle>
      <Flashcard
        variant="preview"
        badges={category ? <Badge tone="category" className="w-full">{category}</Badge> : undefined}
        question={question.trim() || <span className="text-ink-3">{QUESTION_PLACEHOLDER}</span>}
        answer={answer.trim() || ANSWER_PLACEHOLDER}
      />
    </Card>
  );
}
