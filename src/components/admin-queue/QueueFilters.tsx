"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { FilterBar } from "@/components/ui/FilterBar";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { QUEUE_PATH, parseQueueParams, queueQuery, type QueueParams } from "@/server/services/adminQueueParams";
import type { CategoryRow } from "@/server/services/listCategories";

const SORTS = [
  { value: "oldest", label: "Najstarsze pierwsze" },
  { value: "newest", label: "Najnowsze pierwsze" },
];

/**
 * SCR-16 elements 3-4. A plain GET form, so it works without JavaScript; with it a change navigates
 * to the clean address (defaults left out) and the server renders the new list (behaviour row 7).
 * The tab rides along as a hidden field so choosing a category never drops it.
 */
export function QueueFilters({ categories, params }: { categories: CategoryRow[]; params: QueueParams }) {
  const router = useRouter();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const raw: Record<string, string> = {};
    for (const [key, value] of new FormData(event.currentTarget)) {
      if (typeof value === "string") raw[key] = value;
    }
    router.push(`${QUEUE_PATH}${queueQuery(parseQueueParams(raw))}`, { scroll: false });
  }

  return (
    <FilterBar action={QUEUE_PATH} method="get" onSubmit={submit}>
      <input type="hidden" name="tab" value={params.tab} />
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
    </FilterBar>
  );
}
