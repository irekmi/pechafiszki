"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button, type ButtonSize } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Notice } from "@/components/ui/Notice";
import { deleteUserAction } from "@/server/actions/deleteUser";
import { userHref } from "@/server/services/usersParams";

const DELETE_TEXT =
  "Razem z kontem usuniemy oceny fiszek, statystyki i historię sesji tej osoby. " +
  "Zgłoszone przez nią fiszki zostaną w puli z autorem „Usunięty użytkownik”.";

type DeleteUserProps = {
  id: number;
  /** The row's `blockReason`: when set the button is inactive and the reason is its tooltip. */
  blockReason: string | null;
  size?: ButtonSize;
  /** SCR-19's row: the list refreshes in place and this runs once the account is gone. SCR-20 omits it and is redirected. */
  onDeleted?: () => void;
};

/**
 * **Usuń użytkownika** with its confirmation modal (SCR-19 element 8 and 10, SCR-20 element 4 and 11).
 * The inactive button is presentation only: `deleteUserAction` refuses both blocks itself, and if it
 * does — a stale page — the note is shown in the dialog. An account that is already gone sends the caller
 * to its own address, which is SCR-22's 404 (SCR-19 state "error").
 */
export function DeleteUser({ id, blockReason, size, onDeleted }: DeleteUserProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [busy, startTransition] = useTransition();

  function confirm() {
    startTransition(async () => {
      const result = await deleteUserAction(onDeleted ? { id, stay: true } : { id });
      if (result.ok) {
        setOpen(false);
        onDeleted?.();
      } else if (result.reason === "not-found") {
        router.replace(userHref(id));
      } else {
        setNote(result.note);
      }
    });
  }

  return (
    <>
      <Button variant="danger" size={size} disabled={busy || blockReason !== null} title={blockReason ?? undefined} onClick={() => setOpen(true)}>
        Usuń użytkownika
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Usunąć tego użytkownika na stałe?"
        text={DELETE_TEXT}
        actions={
          <>
            <Button onClick={() => setOpen(false)}>Anuluj</Button>
            <Button variant="danger-solid" disabled={busy} onClick={confirm}>
              Usuń użytkownika
            </Button>
          </>
        }
      >
        {note ? <Notice tone="danger" role="alert">{note}</Notice> : null}
      </Modal>
    </>
  );
}
