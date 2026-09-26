"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { FilterBar } from "@/components/ui/FilterBar";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { SearchField } from "@/components/ui/SearchField";
import { ADMIN_CARDS_PATH } from "@/server/services/adminCardsPath";
import { adminCardsHref, parseAdminCardsParams, type AdminCardsParams } from "@/server/services/adminCardsParams";
import type { CategoryRow } from "@/server/services/listCategories";

const STATUSES = [
  { value: "", label: "Wszystkie" },
  { value: "pending", label: "Oczekujące" },
  { value: "approved", label: "Zatwierdzone" },
  { value: "rejected", label: "Odrzucone" },
];

const SORTS = [
  { value: "newest", label: "Najnowsze" },
  { value: "oldest", label: "Najstarsze" },
  { value: "category", label: "Kategoria" },
  { value: "author", label: "Autor" },
];

/**
 * The filter bar of SCR-18. A plain GET form, so it works without JavaScript; with it, a change
 * navigates to the clean address (defaults left out, `limit` back to 20) and the server renders the
 * new table (DEC-51). **Wyczyść filtry** drops every parameter.
 */
export function AdminCardsFilters({ categories, params }: { categories: CategoryRow[]; params: AdminCardsParams }) {
  const router = useRouter();
  const [text, setText] = useState(params.query ?? "");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const raw: Record<string, string> = {};
    for (const [key, value] of new FormData(event.currentTarget)) {
      if (typeof value === "string") raw[key] = value;
    }
    router.push(adminCardsHref(parseAdminCardsParams(raw)), { scroll: false });
  }

  function clear() {
    setText("");
    router.push(ADMIN_CARDS_PATH, { scroll: false });
  }

  return (
    <FilterBar role="search" action={ADMIN_CARDS_PATH} method="get" onSubmit={submit}>
      <SearchField value={text} onChange={setText} placeholder="np. indeks, useMemo, 403" />
      <FilterSelect id="status" label="Status" value={params.status ?? ""} options={STATUSES} />
      <FilterSelect
        id="category"
        label="Kategoria"
        value={params.category ? String(params.category) : ""}
        options={[
          { value: "", label: "Wszystkie kategorie" },
          ...categories.map((category) => ({ value: String(category.id), label: category.name })),
        ]}
      />
      <FilterSelect id="sort" label="Sortowanie" value={params.sort} options={SORTS} />
      <Button variant="ghost" onClick={clear}>
        Wyczyść filtry
      </Button>
    </FilterBar>
  );
}
