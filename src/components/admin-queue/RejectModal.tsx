"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Field, INVALID_FIELD_CLASS } from "@/components/ui/Field";
import { Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { REASON_MAX } from "@/server/services/rejectReason";

const DEFAULT_TEXT = "Autor zobaczy powód odrzucenia i będzie mógł poprawić fiszkę oraz wysłać ją ponownie.";

type RejectModalProps = {
  /** SCR-16 and SCR-17 word the lead-in differently; the mockups each have their own. */
  text?: string;
  busy: boolean;
  error: string | undefined;
  onCancel: () => void;
  onSubmit: (reason: string) => void;
  onEdit: () => void;
};

/**
 * SCR-16 element 7 and SCR-17 element 11 — "Odrzuć fiszkę" with its required **Powód odrzucenia** (DEC-32). The browser
 * blocks an empty reason here; the server does not rely on that. Rendered only while a row is being
 * rejected, so each opening starts with an empty textarea.
 */
export function RejectModal({ text = DEFAULT_TEXT, busy, error, onCancel, onSubmit, onEdit }: RejectModalProps) {
  const [reason, setReason] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    onSubmit(reason);
  }

  return (
    <Modal
      open
      onClose={onCancel}
      title="Odrzuć fiszkę"
      text={text}
      actions={
        <>
          <Button onClick={onCancel}>Anuluj</Button>
          <Button type="submit" form="reject-form" variant="danger-solid" disabled={busy}>
            Odrzuć fiszkę
          </Button>
        </>
      }
    >
      <form id="reject-form" noValidate onSubmit={submit}>
        <Field label="Powód odrzucenia" htmlFor="rejection_reason" error={error}>
          <Textarea
            id="rejection_reason"
            name="rejection_reason"
            required
            maxLength={REASON_MAX}
            placeholder="Napisz, co trzeba poprawić"
            value={reason}
            aria-invalid={error ? true : undefined}
            className={error ? INVALID_FIELD_CLASS : undefined}
            onChange={(event) => {
              setReason(event.target.value);
              if (error) onEdit();
            }}
          />
        </Field>
      </form>
    </Modal>
  );
}
