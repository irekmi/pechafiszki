"use client";

import { Chip } from "@/components/ui/Chip";
import { ChipGroup } from "@/components/ui/ChipGroup";
import type { SessionFilters } from "@/server/services/sessionFilters";
import type { CategoryRow } from "@/server/services/listCategories";

type MarkKey = NonNullable<SessionFilters["mark"]>;

const MARK_CHIPS: { key: MarkKey; label: string }[] = [
  { key: "unknown", label: "Nie umiem" },
  { key: "repeat", label: "Do powtórki" },
  { key: "know", label: "Umiem" },
];

type FilterChipsProps = {
  categories: CategoryRow[];
  marks: Record<MarkKey, number>;
  filters: SessionFilters;
  showMarks: boolean;
  onChange: (next: Pick<SessionFilters, "category" | "mark">) => void;
};

/** The two chip groups of SCR-06 — Kategoria (API-26 with counts) and Ocena — one active at a time. */
export function FilterChips({ categories, marks, filters, showMarks, onChange }: FilterChipsProps) {
  const total = categories.reduce((sum, category) => sum + (category.flashcardCount ?? 0), 0);
  const { category, mark } = filters;
  return (
    <div className="grid gap-3">
      <ChipGroup legend="Kategoria">
        <Chip active={category === undefined} count={total} onClick={() => onChange({ mark })}>
          Wszystkie
        </Chip>
        {categories.map((row) => (
          <Chip
            key={row.id}
            active={category === row.id}
            count={row.flashcardCount}
            onClick={() => onChange({ category: row.id, mark })}
          >
            {row.name}
          </Chip>
        ))}
      </ChipGroup>
      {showMarks ? (
        <ChipGroup legend="Ocena">
          <Chip active={mark === undefined} onClick={() => onChange({ category })}>
            Wszystkie
          </Chip>
          {MARK_CHIPS.map((chip) => (
            <Chip
              key={chip.key}
              active={mark === chip.key}
              count={marks[chip.key]}
              onClick={() => onChange({ category, mark: chip.key })}
            >
              {chip.label}
            </Chip>
          ))}
        </ChipGroup>
      ) : null}
    </div>
  );
}
