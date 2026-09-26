"use server";

import { redirect } from "next/navigation";
import type { ZodError } from "zod";
import { requireUser } from "@/server/permissions";
import { MY_CARDS_PATH, SUBMITTED_NOTICE } from "@/server/services/myCardsParams";
import { CATEGORY_MESSAGE, submitFlashcard, submitFlashcardSchema } from "@/server/services/submitFlashcard";
import type { SubmitErrors, SubmitState } from "./submitFlashcardState";

/** A form value that is not text (a file part, say) counts as empty. */
function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

const FIELD_OF: Record<string, keyof SubmitErrors> = {
  category: "category",
  question: "question",
  answer: "answer",
  code_example: "codeExample",
};

function errorsOf(error: ZodError): SubmitErrors {
  const errors: SubmitErrors = {};
  for (const issue of error.issues) {
    const key = FIELD_OF[String(issue.path[0])];
    if (key) errors[key] ??= issue.message;
  }
  return errors;
}

/**
 * API-16 — submits a flashcard into the approval queue. The session is checked first (a Guest is
 * sent to SCR-01), and only the four documented fields are read: a `status`, `authorId` or `role`
 * posted alongside them is never looked at, and the service fixes `PENDING` and the author itself
 * (NFR-01, AC-13.3). The limits are enforced here, not by the browser's `maxlength` (AC-13.4).
 */
export async function submitFlashcardAction(_previous: SubmitState, formData: FormData): Promise<SubmitState> {
  const user = await requireUser();

  const parsed = submitFlashcardSchema.safeParse({
    category: field(formData, "category"),
    question: field(formData, "question"),
    answer: field(formData, "answer"),
    code_example: field(formData, "code_example"),
  });
  if (!parsed.success) return { errors: errorsOf(parsed.error) };

  const result = await submitFlashcard(user, parsed.data);
  if (!result.ok) {
    return result.reason === "no-categories"
      ? { errors: {}, noCategories: true }
      : { errors: { category: CATEGORY_MESSAGE } };
  }
  redirect(`${MY_CARDS_PATH}?zmiana=${SUBMITTED_NOTICE}`);
}
