"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { FilterBar } from "@/components/ui/FilterBar";
import { SearchField } from "@/components/ui/SearchField";
import type { CategoryRow } from "@/server/services/listCategories";
import { libraryQuery, parseLibraryParams, type LibraryParams } from "@/server/services/libraryParams";
import { FilterSelect } from "@/components/ui/FilterSelect";

const MARKS = [
  { value: "", label: "Wszystkie" },
  { value: "know", label: "Umiem" },
  { value: "repeat", label: "Do powtórki" },
  { value: "unknown", label: "Nie umiem" },
  { value: "new", label: "Nie zaczęte" },
];

const SORTS = [
  { value: "newest", label: "Najnowsze" },
  { value: "oldest", label: "Najstarsze" },
  { value: "category", label: "Kategoria" },
  { value: "mark", label: "Moja ocena" },
];

/**
 * The filter bar of SCR-08. It is a plain GET form, so it works without JavaScript; with it, a
 * change navigates to the clean URL (defaults left out, `limit` back to 20) and the server renders
 * the new list (DEC-51). The unsubmitted search text is the only state kept here.
 */
export function LibraryFilters({ categories, params }: { categories: CategoryRow[]; params: LibraryParams }) {
  const router = useRouter();
  const [text, setText] = useState(params.query ?? "");

  function go(next: LibraryParams) {
    router.push(`/fiszki${libraryQuery(next)}`, { scroll: false });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const raw: Record<string, string> = {};
    for (const [key, value] of new FormData(event.currentTarget)) {
      if (typeof value === "string") raw[key] = value;
    }
    go(parseLibraryParams(raw));
  }

  function clear() {
    setText("");
    router.push("/fiszki", { scroll: false });
  }

  return (
    <FilterBar role="search" action="/fiszki" method="get" onSubmit={submit}>
      <SearchField value={text} onChange={setText} />
      <FilterSelect
        id="category"
        label="Kategoria"
        value={params.category ? String(params.category) : ""}
        options={[
          { value: "", label: "Wszystkie kategorie" },
          ...categories.map((category) => ({ value: String(category.id), label: category.name })),
        ]}
      />
      <FilterSelect id="mark" label="Moja ocena" value={params.mark ?? ""} options={MARKS} />
      <FilterSelect id="sort" label="Sortowanie" value={params.sort} options={SORTS} />
      <Button variant="ghost" onClick={clear}>
        Wyczyść filtry
      </Button>
    </FilterBar>
  );
}
