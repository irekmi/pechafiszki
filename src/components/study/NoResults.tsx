import { ButtonLink } from "@/components/ui/Button";
import { NoResultsArt } from "@/components/ui/EmptyArt";
import { EmptyState } from "@/components/ui/EmptyState";
import type { SessionFilters } from "@/server/services/sessionFilters";
import { ResetFiltersButton } from "./ResetFiltersButton";

function describe(filters: SessionFilters, categoryName: string | null): string {
  const query = filters.query ? `zapytaniu „${filters.query}”` : null;
  const category = categoryName ? `w kategorii ${categoryName}` : null;
  if (!query) return "Żadna fiszka nie pasuje do wybranych filtrów. Wyczyść filtry, żeby uczyć się z całej puli.";
  return `Żadna fiszka nie odpowiada ${[query, category].filter(Boolean).join(" ")}. Zmień frazę albo wyczyść filtry, żeby uczyć się z całej puli.`;
}

/** SCR-06 "empty — no results": the search or the filters match nothing. */
export function NoResults({ filters, categoryName }: { filters: SessionFilters; categoryName: string | null }) {
  return (
    <EmptyState
      art={<NoResultsArt />}
      title="Brak wyników"
      text={describe(filters, categoryName)}
      actions={
        <>
          <ResetFiltersButton variant="primary" />
          <ButtonLink href="/fiszki">Przejdź do biblioteki</ButtonLink>
        </>
      }
    />
  );
}
