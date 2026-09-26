import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { DeleteCard } from "@/components/edit-card/DeleteCard";
import { ButtonLink } from "@/components/ui/Button";
import { PageActions, PageHead, PageTitleGroup } from "@/components/ui/Page";
import { Muted, PageTitle } from "@/components/ui/Typography";
import { formatDate } from "@/components/study/formatDate";
import type { FlashcardDetail } from "@/server/services/getFlashcard";
import { authorName, questionFragment } from "./detailFormat";

type DetailHeadProps = { detail: FlashcardDetail; backHref: string };

/**
 * SCR-09 elements 1–4: breadcrumb, heading, sub-line and **Wróć do listy**. `backHref` carries the
 * filters the caller arrived with (DEC-51). **Edytuj** and **Usuń** (elements 5–6) are drawn only when
 * the server computed both `canEdit` and `canDelete` for this caller — an administrator (DEV-04); for
 * anyone else they are absent from the markup.
 */
export function DetailHead({ detail, backHref }: DetailHeadProps) {
  const { card, author } = detail;
  // AC-16.9: both actions are the administrator's here. `canDelete` is the server's administrator-only
  // rule (API-23); an author reaches their own card's form from SCR-11, not from this screen.
  const admin = detail.canEdit && detail.canDelete;
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
          {admin ? <ButtonLink href={`/edytuj/${card.id}`}>Edytuj</ButtonLink> : null}
          {admin ? <DeleteCard id={card.id} asAdmin label="Usuń" /> : null}
        </PageActions>
      </PageHead>
    </>
  );
}
