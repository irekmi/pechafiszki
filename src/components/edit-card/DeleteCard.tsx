"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { deleteFlashcardAction } from "@/server/actions/deleteFlashcard";
import { deleteOwnFlashcardAction } from "@/server/actions/deleteOwnFlashcard";

/** The two warnings: the mockup's for the author (SCR-12), and SCR-09's for an administrator (DEC-37). */
const DELETE_TEXT = {
  author: "Fiszka zniknie z Twoich zgłoszeń i z kolejki administratora. Tej operacji nie można cofnąć.",
  admin: "Uczący się stracą swój postęp na tej fiszce. Tej operacji nie można cofnąć.",
} as const;

type DeleteCardProps = { id: number; asAdmin: boolean; label?: string };

/**
 * **Usuń fiszkę** (SCR-12 element 14, SCR-09's **Usuń**) with its confirmation modal (element 16). The
 * role picks the action, but only for the wording and the destination: both actions check the session and
 * their own object rule on the server, so choosing the wrong one here would be refused, not obeyed.
 */
export function DeleteCard({ id, asAdmin, label = "Usuń fiszkę" }: DeleteCardProps) {
  const [open, setOpen] = useState(false);
  const [busy, startTransition] = useTransition();
  const remove = asAdmin ? deleteFlashcardAction : deleteOwnFlashcardAction;

  return (
    <>
      <Button variant="danger" onClick={() => setOpen(true)}>
        {label}
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Usunąć tę fiszkę na stałe?"
        text={asAdmin ? DELETE_TEXT.admin : DELETE_TEXT.author}
        actions={
          <>
            <Button onClick={() => setOpen(false)}>Anuluj</Button>
            <Button variant="danger-solid" disabled={busy} onClick={() => startTransition(() => remove({ id }))}>
              Usuń fiszkę
            </Button>
          </>
        }
      />
    </>
  );
}
