import type { ReactNode } from "react";
import { ButtonLink } from "./Button";
import { Row } from "./Page";
import { Hint } from "./Typography";

const CARDS_NOUN = { singular: "fiszki", plural: "fiszek" };

type PagingFooterProps = {
  shown: number;
  total: number;
  /** Where **Pokaż więcej** goes; `null` when every row is already shown or the ceiling is reached. */
  moreHref: string | null;
  /** The counted thing, genitive plural ("fiszek", "użytkowników", "zgłoszeń"); `singular` reads for a total of 1. */
  noun?: { singular: string; plural: string };
};

/** `.row--between` under a list or table: "Pokazano N z M fiszek" and **Pokaż więcej** (DEC-48). */
export function PagingFooter({ shown, total, moreHref, noun = CARDS_NOUN }: PagingFooterProps): ReactNode {
  return (
    <Row between>
      <Hint>{`Pokazano ${shown} z ${total} ${total === 1 ? noun.singular : noun.plural}`}</Hint>
      {moreHref ? (
        <ButtonLink href={moreHref} scroll={false}>
          Pokaż więcej
        </ButtonLink>
      ) : null}
    </Row>
  );
}
