import { authorName } from "@/components/card-detail/detailFormat";
import { formatDate } from "@/components/study/formatDate";
import { Card } from "@/components/ui/Card";
import { Datalist, DatalistRow } from "@/components/ui/Datalist";
import { TextLink } from "@/components/ui/TextLink";
import { SectionTitle } from "@/components/ui/Typography";
import type { AuthorRecord } from "@/server/services/getAuthorRecord";
import type { SimilarQuestion } from "@/server/services/findSimilarQuestions";
import { SimilarQuestions } from "./SimilarQuestions";

type SubmissionCardProps = { submittedAt: Date; author: AuthorRecord | null; similar: SimilarQuestion[] };

/** SCR-17 element 10 — the tinted card: author (→ SCR-20), date, the author's record (DEC-36), similar questions (DEC-35). */
export function SubmissionCard({ submittedAt, author, similar }: SubmissionCardProps) {
  return (
    <Card tint>
      <SectionTitle>Zgłoszenie</SectionTitle>
      <Datalist>
        <DatalistRow
          label="Autor"
          value={
            author ? (
              <TextLink href={`/administracja/uzytkownicy/${author.authorId}`}>{author.nickname}</TextLink>
            ) : (
              authorName(null)
            )
          }
        />
        <DatalistRow label="Zgłoszona" value={formatDate(submittedAt)} />
        {author ? (
          <DatalistRow
            label="Zgłoszenia tego autora"
            value={`${author.approved} zatwierdzonych, ${author.rejected} odrzucone`}
          />
        ) : null}
        <DatalistRow
          label="Podobne pytania w puli"
          stacked={similar.length > 0}
          value={similar.length > 0 ? <SimilarQuestions similar={similar} /> : "brak"}
        />
      </Datalist>
    </Card>
  );
}
