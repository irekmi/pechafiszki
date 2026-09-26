import type { ZodError } from "zod";
import { CATEGORY_MESSAGE, submitFlashcardSchema, type SubmitFlashcardInput } from "@/server/services/submitFlashcard";
import type { SubmitErrors } from "./submitFlashcardState";

/** Not a `"use server"` module: the form reading SCR-10 and SCR-12 share, so both validate identically. */

/** A form value that is not text (a file part, say) counts as empty. */
export function formField(formData: FormData, name: string): string {
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

export type FlashcardForm = { ok: true; data: SubmitFlashcardInput } | { ok: false; errors: SubmitErrors };

/**
 * The four documented fields, and only those: a `status`, `authorId` or `role` posted alongside them
 * is never looked at (NFR-01). The limits are enforced here, not by the browser's `maxlength`.
 */
export function readFlashcardForm(formData: FormData): FlashcardForm {
  const parsed = submitFlashcardSchema.safeParse({
    category: formField(formData, "category"),
    question: formField(formData, "question"),
    answer: formField(formData, "answer"),
    code_example: formField(formData, "code_example"),
  });
  return parsed.success ? { ok: true, data: parsed.data } : { ok: false, errors: errorsOf(parsed.error) };
}

export const CATEGORY_ERROR = { category: CATEGORY_MESSAGE } satisfies SubmitErrors;
