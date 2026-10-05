"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { FilterBar } from "@/components/ui/FilterBar";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { SearchField } from "@/components/ui/SearchField";
import { ADMIN_USERS_PATH, parseUsersParams, usersHref, type UsersParams } from "@/server/services/usersParams";

const ROLES = [
  { value: "", label: "Wszystkie" },
  { value: "user", label: "Użytkownik" },
  { value: "admin", label: "Administrator" },
];

const SORTS = [
  { value: "newest", label: "Najnowsze" },
  { value: "oldest", label: "Najstarsze" },
  { value: "nickname", label: "Pseudonim" },
];

/**
 * The filter bar of SCR-19 — a plain GET form, so it works without JavaScript; with it, a change
 * navigates to the clean address (defaults left out, `limit` back to 20). **Wyczyść filtry** drops every
 * parameter. The phrase travels in the URL, which is an administrator's own address bar.
 */
export function UsersFilters({ params }: { params: UsersParams }) {
  const router = useRouter();
  const [text, setText] = useState(params.query ?? "");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const raw: Record<string, string> = {};
    for (const [key, value] of new FormData(event.currentTarget)) {
      if (typeof value === "string") raw[key] = value;
    }
    router.push(usersHref(parseUsersParams(raw)), { scroll: false });
  }

  function clear() {
    setText("");
    router.push(ADMIN_USERS_PATH, { scroll: false });
  }

  return (
    <FilterBar role="search" action={ADMIN_USERS_PATH} method="get" onSubmit={submit}>
      <SearchField value={text} onChange={setText} label="Szukaj po pseudonimie lub e-mailu" placeholder="np. anna albo example.com" />
      <FilterSelect id="role" label="Rola" value={params.role ?? ""} options={ROLES} />
      <FilterSelect id="sort" label="Sortowanie" value={params.sort} options={SORTS} />
      <Button variant="ghost" onClick={clear}>
        Wyczyść filtry
      </Button>
    </FilterBar>
  );
}
