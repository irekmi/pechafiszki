import { Badge } from "@/components/ui/Badge";
import { Code } from "@/components/ui/Code";
import { Flashcard } from "@/components/ui/Flashcard";
import { KitSection } from "./KitSection";

const EXAMPLE = `function demo() {
  const value = 1;
  return value;
}`;

export function KitFlashcard() {
  return (
    <KitSection title="Fiszka">
      <Flashcard
        badges={
          <>
            <Badge tone="category">JavaScript</Badge>
            <Badge tone="repeat">Powtórka</Badge>
          </>
        }
        question="Czym różni się let od var w zasięgu zmiennej?"
        answer="var ma zasięg funkcji i jest podnoszony na jej początek z wartością undefined."
        example={<Code>{EXAMPLE}</Code>}
      />
      <Flashcard variant="preview" question="Podgląd fiszki przed wysłaniem" />
    </KitSection>
  );
}
