import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { ButtonLink } from "@/components/ui/Button";
import { PageActions, PageHead, PageTitleGroup } from "@/components/ui/Page";
import { Muted, PageTitle } from "@/components/ui/Typography";
import { formatDate } from "@/components/study/formatDate";
import type { FlashcardDetail } from "@/server/services/getFlashcard";
import { authorName, questionFragment } from "./detailFormat";

type DetailHeadProps = { detail: FlashcardDetail; backHref: string };

/**
 * SCR-09 elements 1–4: breadcrumb, heading, sub-line and **Wróć do listy**. `backHref` carries the
 * filters the caller arrived with (DEC-51). **Edytuj** and **Usuń** (elements 5–6) arrive with
 * ST-16, together with the screens they lead to (DEV-04).
 */
export function DetailHead({ detail, backHref }: DetailHeadProps) {
  const { card, author } = detail;
  const published = card.publishedAt ? ` · opublikowana ${formatDate(card.publishedAt)}` : "";
  return (
    <>
      <Breadcrumb
        items={[
          { label: "Fiszki", href: backHref },
          { label: card.category.name },
          { label: questionFragment(card.question) },
        ]}
      />
      <PageHead>
        <PageTitleGroup>
          <PageTitle>Szczegóły fiszki</PageTitle>
          <Muted>{`Dodana przez ${authorName(author)}${published}`}</Muted>
        </PageTitleGroup>
        <PageActions>
          <ButtonLink href={backHref}>Wróć do listy</ButtonLink>
        </PageActions>
      </PageHead>
    </>
  );
}
