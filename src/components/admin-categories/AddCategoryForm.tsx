"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { INVALID_FIELD_CLASS } from "@/components/ui/Field";
import { FilterBar, FilterItem, FilterLabel } from "@/components/ui/FilterBar";
import { Input } from "@/components/ui/Input";
import { Notice } from "@/components/ui/Notice";
import { useToastBoard } from "@/components/ui/ToastBoard";
import { createCategoryAction } from "@/server/actions/createCategory";
import { emptyAddCategoryState } from "@/server/actions/categoryFormState";

/**
 * SCR-21 element 2 — the add-category form (`.filters`). The input is uncontrolled and remounted by
 * `key` on every submission (as `SignUpPasswordFields` does): a failed attempt keeps the typed value
 * for correction, a success clears it and raises the "Kategoria dodana" toast once per `addedId`.
 */
export function AddCategoryForm() {
  const [state, formAction, pending] = useActionState(createCategoryAction, emptyAddCategoryState);
  const [attempt, setAttempt] = useState(0);
  const previous = useRef(state);
  const notify = useToastBoard();

  useEffect(() => {
    if (previous.current === state) return;
    previous.current = state;
    setAttempt((value) => value + 1);
    if (state.addedId) notify("Kategoria dodana");
  }, [state, notify]);

  return (
    <FilterBar action={formAction}>
      <FilterItem grow>
        <FilterLabel htmlFor="new_category">Nazwa nowej kategorii</FilterLabel>
        <Input
          key={attempt}
          id="new_category"
          name="new_category"
          type="text"
          required
          maxLength={40}
          placeholder="np. Systemy rozproszone"
          defaultValue={state.name}
          className={state.error ? INVALID_FIELD_CLASS : undefined}
        />
      </FilterItem>
      <Button type="submit" variant="primary" disabled={pending}>
        Dodaj kategorię
      </Button>
      {state.error ? (
        <Notice tone="danger" role="alert" className="w-full">
          {state.error}
        </Notice>
      ) : null}
    </FilterBar>
  );
}
