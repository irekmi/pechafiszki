"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Notice } from "@/components/ui/Notice";
import { deleteCategoryAction } from "@/server/actions/deleteCategory";

const TEXT =
  "Kategoria zniknie z filtrów i z formularza dodawania fiszki. Usunąć można tylko kategorię bez fiszek.";
const BLOCK_NOTE = "Ta kategoria zawiera fiszki i nie można jej usunąć";

/**
 * **Usuń** with its confirmation modal (SCR-21 elements 5 and 7). The button is inactive while the
 * category holds a flashcard, with the block message as its tooltip (behaviour row 6); the same
 * message is enforced again by `deleteCategoryAction`, so a stale page cannot bypass it.
 */
export function DeleteCategory({
  id,
  deletable,
  onDeleted,
}: {
  id: number;
  deletable: boolean;
  onDeleted: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [busy, startTransition] = useTransition();

  function confirm() {
    startTransition(async () => {
      const result = await deleteCategoryAction({ id });
      if (result.ok) {
        setOpen(false);
        onDeleted();
      } else {
        setNote(result.note);
      }
    });
  }

  return (
    <>
      <Button
        variant="danger"
        size="sm"
        disabled={busy || !deletable}
        title={deletable ? undefined : BLOCK_NOTE}
        onClick={() => setOpen(true)}
      >
        Usuń
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Usunąć tę kategorię?"
        text={TEXT}
        actions={
          <>
            <Button onClick={() => setOpen(false)}>Anuluj</Button>
            <Button variant="danger-solid" disabled={busy} onClick={confirm}>
              Usuń kategorię
            </Button>
          </>
        }
      >
        {note ? (
          <Notice tone="danger" role="alert">
            {note}
          </Notice>
        ) : null}
      </Modal>
    </>
  );
}
