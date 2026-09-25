import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import type { SessionFilters } from "@/server/services/sessionFilters";
import { ResetFiltersButton } from "./ResetFiltersButton";

/** The mockup's magnifier over two cards, drawn with theme colours (the mockup's oklch literals are stale). */
function NoResultsArt() {
  return (
    <svg viewBox="0 0 132 92" aria-hidden="true" className="block w-full h-full">
      <rect x="14" y="16" width="80" height="58" rx="10" fill="none" stroke="currentColor" strokeOpacity="0.22" strokeWidth="2" />
      <rect x="38" y="28" width="80" height="58" rx="10" className="fill-surface-2 stroke-surface-3" strokeWidth="2" />
      <circle cx="72" cy="52" r="13" fill="none" className="stroke-brand" strokeWidth="2.4" />
      <path d="M82 62l12 12" className="stroke-brand" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

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
