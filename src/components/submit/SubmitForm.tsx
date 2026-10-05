"use client";

import { startTransition, useActionState, useState, type FormEvent, type ReactNode } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card, CardFoot } from "@/components/ui/Card";
import { AlertIcon } from "@/components/ui/icons";
import { Notice } from "@/components/ui/Notice";
import { Grid, Row, Stack } from "@/components/ui/Page";
import { submitFlashcardAction } from "@/server/actions/submitFlashcard";
import { emptySubmitState } from "@/server/actions/submitFlashcardState";
import type { CategoryRow } from "@/server/services/listCategories";
import { SubmitFields } from "./SubmitFields";
import { SubmitPreview } from "./SubmitPreview";
import { emptySubmitValues, type SubmitValues } from "./submitValues";

type SubmitFormProps = { categories: Pick<CategoryRow, "id" | "name">[]; aside: ReactNode };

/**
 * SCR-10's two columns. The typed values live here, so a refused submission keeps every one of them
 * (state `error`) and the preview re-renders on each keystroke (behaviour row 1). With no category
 * at all — read on the server, or reported by API-16 — the fields and the button are inactive and
 * the warning is drawn (behaviour row 6).
 */
export function SubmitForm({ categories, aside }: SubmitFormProps) {
  const [state, formAction, pending] = useActionState(submitFlashcardAction, emptySubmitState);
  const [values, setValues] = useState<SubmitValues>(emptySubmitValues);
  const noCategories = categories.length === 0 || Boolean(state.noCategories);
  const category = categories.find((row) => String(row.id) === values.category);

  // Not `<form action>`: React 19 resets the form after such an action, and a reset returns a
  // controlled <select> to its first option, losing the chosen category on a refusal.
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(() => formAction(data));
  }

  return (
    <Grid cols={2}>
      <form onSubmit={submit} noValidate className="grid">
        <Card>
          <Stack>
            <SubmitFields
              values={values}
              errors={state.errors}
              categories={categories}
              disabled={noCategories}
              onChange={(name, value) => setValues((current) => ({ ...current, [name]: value }))}
            />
            <CardFoot>
              <Row className="justify-end">
                <ButtonLink href="/fiszki">Anuluj</ButtonLink>
                <Button type="submit" variant="primary" disabled={noCategories || pending}>
                  Wyślij do zatwierdzenia
                </Button>
              </Row>
            </CardFoot>
          </Stack>
        </Card>
      </form>

      <Stack className="content-start">
        <SubmitPreview category={category?.name} question={values.question} answer={values.answer} />
        {aside}
        {noCategories ? (
          <Notice tone="warning" role="alert" icon={<AlertIcon />}>
            Nie ma jeszcze żadnych kategorii, skontaktuj się z administratorem
          </Notice>
        ) : null}
      </Stack>
    </Grid>
  );
}
