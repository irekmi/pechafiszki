import type { ReactNode } from "react";
import { ButtonLink } from "./Button";
import { Row } from "./Page";
import { Hint } from "./Typography";

type PagingFooterProps = {
  shown: number;
  total: number;
  /** Where **Pokaż więcej** goes; `null` when every row is already shown or the ceiling is reached. */
  moreHref: string | null;
};

/** `.row--between` under a list or table: "Pokazano N z M fiszek" and **Pokaż więcej** (DEC-48). */
export function PagingFooter({ shown, total, moreHref }: PagingFooterProps): ReactNode {
  return (
    <Row between>
      <Hint>{`Pokazano ${shown} z ${total} ${total === 1 ? "fiszki" : "fiszek"}`}</Hint>
      {moreHref ? (
        <ButtonLink href={moreHref} scroll={false}>
          Pokaż więcej
        </ButtonLink>
      ) : null}
    </Row>
  );
}
