import { TextLink } from "@/components/ui/TextLink";
import type { SimilarQuestion } from "@/server/services/findSimilarQuestions";

/** DEC-35 — up to three close questions already in the pool, each opening its card; advisory only. */
export function SimilarQuestions({ similar }: { similar: SimilarQuestion[] }) {
  return (
    <ul className="grid gap-1.5 font-normal">
      {similar.map((item) => (
        <li key={item.id}>
          <TextLink href={`/fiszki/${item.id}`}>{item.question}</TextLink>
        </li>
      ))}
    </ul>
  );
}
