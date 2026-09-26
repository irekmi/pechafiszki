"use client";

import { startTransition, useActionState, useState, type FormEvent, type ReactNode } from "react";
import { SubmitFields } from "@/components/submit/SubmitFields";
import { SubmitPreview } from "@/components/submit/SubmitPreview";
import type { SubmitValues } from "@/components/submit/submitValues";
import { Card } from "@/components/ui/Card";
import { AlertIcon } from "@/components/ui/icons";
import { Notice } from "@/components/ui/Notice";
import { Grid, Stack } from "@/components/ui/Page";
import { adminUpdateFlashcardAction } from "@/server/actions/adminUpdateFlashcard";
import { emptyEditState } from "@/server/actions/editFlashcardState";
import { updateOwnFlashcardAction } from "@/server/actions/updateOwnFlashcard";
import type { CategoryRow } from "@/server/services/listCategories";
import { AdminSaveCard } from "./AdminSaveCard";
import { EditFooter } from "./EditFooter";
import { SavedToast } from "./SavedToast";

const FORM_ID = "edit-form";
const CONFLICT = "Ta fiszka została już zatwierdzona";

type EditFormProps = {
  id: number;
  approved: boolean;
  isAdmin: boolean;
  initial: SubmitValues;
  categories: Pick<CategoryRow, "id" | "name">[];
  /** Where **Anuluj** goes: SCR-11, or the administration list. */
  cancelHref: string;
  /** The rejection notice, rendered by the server, and the history card. */
  notice: ReactNode;
  history: ReactNode;
};

/**
 * SCR-12's two columns. The typed values live here, so a refusal keeps every one of them and the
 * preview follows each keystroke. The administrator gets API-22 and the block beside the form (DEV-04);
 * the author gets API-17. An approval that got in first (DEC-58) leaves the author's form read-only.
 * Not `<form action>`: React 19 resets the form after such an action and loses a controlled select.
 */
export function EditForm({ id, approved, isAdmin, initial, categories, cancelHref, notice, history }: EditFormProps) {
  const [state, formAction, pending] = useActionState(
    isAdmin ? adminUpdateFlashcardAction : updateOwnFlashcardAction,
    emptyEditState,
  );
  const [values, setValues] = useState<SubmitValues>(initial);
  const locked = Boolean(state.conflict) && !isAdmin;
  const category = categories.find((row) => String(row.id) === values.category);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const data = new FormData(event.currentTarget, submitter instanceof HTMLElement ? submitter : null);
    startTransition(() => formAction(data));
  }

  return (
    <Grid cols={2}>
      <form id={FORM_ID} onSubmit={submit} noValidate className="grid">
        <Card className="grid">
          <Stack>
            <input type="hidden" name="id" value={id} />
            {notice}
            {state.conflict ? (
              <Notice tone="danger" role="alert" icon={<AlertIcon />}>
                {CONFLICT}
              </Notice>
            ) : null}
            <SubmitFields
              plain
              values={values}
              errors={state.errors}
              categories={categories}
              disabled={locked}
              onChange={(name, value) => setValues((current) => ({ ...current, [name]: value }))}
            />
            <EditFooter id={id} isAdmin={isAdmin} locked={locked} pending={pending} cancelHref={cancelHref} />
          </Stack>
        </Card>
      </form>

      <Stack className="content-start">
        <SubmitPreview category={category?.name} question={values.question} answer={values.answer} />
        {isAdmin ? <AdminSaveCard formId={FORM_ID} pending={pending} canApprove={!approved} /> : null}
        {history}
      </Stack>
      <SavedToast saved={state.saved} />
    </Grid>
  );
}
