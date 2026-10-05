"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { INVALID_FIELD_CLASS } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Notice } from "@/components/ui/Notice";
import { renameCategoryAction } from "@/server/actions/renameCategory";

type Props = { id: number; name: string; editing: boolean; onSaved: (name: string) => void; onCancel: () => void };

/**
 * The Nazwa cell of one SCR-21 row: plain text, or the inline editor (element 4) prefilled with the
 * current name and hidden until **Zmień nazwę**. The mockup's `app.js` only toggles visibility, so
 * **Zapisz** / **Anuluj** are added here to actually persist (DEC-23: keyed on `id`, never the name).
 */
export function CategoryNameCell({ id, name, editing, onSaved, onCancel }: Props) {
  const [draft, setDraft] = useState(name);
  const [error, setError] = useState<string | null>(null);
  const [busy, startTransition] = useTransition();

  useEffect(() => {
    if (editing) {
      setDraft(name);
      setError(null);
    }
  }, [editing, name]);

  if (!editing) return <span data-name>{name}</span>;

  function save() {
    startTransition(async () => {
      const result = await renameCategoryAction({ id, category_name: draft });
      if (result.ok) onSaved(draft.trim());
      else setError(result.fieldError);
    });
  }

  return (
    <div className="grid gap-1.5 max-w-70">
      <label className="sr-only" htmlFor={`rename-${id}`}>
        Nowa nazwa
      </label>
      <Input
        id={`rename-${id}`}
        value={draft}
        maxLength={40}
        required
        onChange={(event) => setDraft(event.target.value)}
        className={error ? INVALID_FIELD_CLASS : undefined}
      />
      {error ? (
        <Notice tone="danger" role="alert">
          {error}
        </Notice>
      ) : null}
      <div className="flex gap-2">
        <Button size="sm" variant="primary" disabled={busy} onClick={save}>
          Zapisz
        </Button>
        <Button size="sm" disabled={busy} onClick={onCancel}>
          Anuluj
        </Button>
      </div>
    </div>
  );
}
