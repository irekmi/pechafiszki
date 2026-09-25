"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { FilterBar } from "@/components/ui/FilterBar";
import { applySessionFiltersAction } from "@/server/actions/applySessionFilters";
import type { CategoryRow } from "@/server/services/listCategories";
import type { SessionFilters } from "@/server/services/sessionFilters";
import { FilterChips } from "./FilterChips";
import { SearchField } from "./SearchField";

type StudyFiltersProps = {
  categories: CategoryRow[];
  marks: { know: number; repeat: number; unknown: number };
  filters: SessionFilters;
  showMarks?: boolean;
};

/**
 * The search form and both chip groups of SCR-06. Every change rebuilds the queue inside the same
 * session (DEC-17) through one action; the typed text travels with a chip change, so pressing a
 * chip never silently drops what was typed. **Wyczyść** clears the search only.
 */
export function StudyFilters({ categories, marks, filters, showMarks = true }: StudyFiltersProps) {
  const [text, setText] = useState(filters.query ?? "");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function apply(next: SessionFilters) {
    if (pending) return;
    startTransition(async () => {
      await applySessionFiltersAction(next);
      router.refresh();
    });
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    apply({ ...filters, query: text });
  }

  function clear() {
    setText("");
    if (filters.query) apply({ category: filters.category, mark: filters.mark });
  }

  return (
    <div className="grid gap-6">
      <FilterBar role="search" onSubmit={submit}>
        <SearchField value={text} onChange={setText} />
        <Button variant="ghost" onClick={clear}>
          Wyczyść
        </Button>
      </FilterBar>
      <FilterChips
        categories={categories}
        marks={marks}
        filters={filters}
        showMarks={showMarks}
        onChange={(next) => apply({ ...next, query: text })}
      />
    </div>
  );
}
