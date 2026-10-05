import { questionFragment } from "@/components/card-detail/detailFormat";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Page } from "@/components/ui/Page";
import { ADMIN_CARDS_LABEL, ADMIN_CARDS_PATH } from "@/server/services/adminCardsPath";
import type { EditCard } from "@/server/services/getEditCard";
import type { CategoryRow } from "@/server/services/listCategories";
import { MY_CARDS_PATH } from "@/server/services/myCardsParams";
import { EditForm } from "./EditForm";
import { EditHead } from "./EditHead";
import { EditHistory } from "./EditHistory";
import { RejectionNotice } from "./RejectionNotice";

type EditScreenProps = { edit: EditCard; categories: Pick<CategoryRow, "id" | "name">[]; isAdmin: boolean };

/** SCR-12, ported from `12-edytuj-fiszke.html` (DEV-01, DEV-04). The role comes from the session, in the page. */
export function EditScreen({ edit, categories, isAdmin }: EditScreenProps) {
  const { detail, latest } = edit;
  const { card } = detail;
  const listHref = isAdmin ? ADMIN_CARDS_PATH : MY_CARDS_PATH;
  return (
    <Page>
      <Breadcrumb
        items={[
          { label: isAdmin ? ADMIN_CARDS_LABEL : "Moje fiszki", href: listHref },
          { label: questionFragment(card.question) },
        ]}
      />
      <EditHead detail={detail} />
      <EditForm
        id={card.id}
        approved={card.status === "APPROVED"}
        isAdmin={isAdmin}
        initial={{
          category: String(card.category.id),
          question: card.question,
          answer: card.answer,
          codeExample: card.codeExample ?? "",
        }}
        categories={categories}
        cancelHref={listHref}
        notice={card.status === "REJECTED" && latest?.decision === "REJECTED" ? <RejectionNotice latest={latest} /> : null}
        history={<EditHistory submittedAt={card.submittedAt} latest={latest} />}
      />
    </Page>
  );
}
