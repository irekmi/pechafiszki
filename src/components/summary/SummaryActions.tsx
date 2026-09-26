import { ButtonLink } from "@/components/ui/Button";
import type { SessionFilters } from "@/server/services/sessionFilters";
import { ContinueForm } from "./ContinueForm";

type SummaryActionsProps = { filters: SessionFilters; primary: "continue" | "start" };

/**
 * The two actions of SCR-07 element 7, drawn twice (header and what-next card) with the primary
 * emphasis on **Wróć na start** in the header and on **Ucz się dalej** in the card.
 */
export function SummaryActions({ filters, primary }: SummaryActionsProps) {
  const continueFirst = primary === "continue";
  return (
    <>
      <ContinueForm filters={filters} variant={continueFirst ? "primary" : "default"} />
      <ButtonLink href="/" variant={continueFirst ? "default" : "primary"}>
        Wróć na start
      </ButtonLink>
    </>
  );
}
