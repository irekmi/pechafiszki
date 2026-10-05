import { db } from "@/server/db";
import type { SubmitFlashcardInput } from "./submitFlashcard";

/**
 * What the four SCR-12 writes answer. `not-found` covers a missing card and a card the caller may not
 * touch alike (DEC-57) — the caller ends at SCR-22 either way. `already-approved` is DEC-58: the card
 * was approved between the form's load and its save, and nothing was written.
 */
export type EditResult = { ok: true } | { ok: false; reason: "not-found" | "already-approved" | "category" };

export const REFUSED = {
  notFound: { ok: false, reason: "not-found" },
  approved: { ok: false, reason: "already-approved" },
  category: { ok: false, reason: "category" },
} as const satisfies Record<string, EditResult>;

/** The columns a save of the four form fields writes (API-16's field names mapped to the model's). */
export function cardFields(input: SubmitFlashcardInput) {
  return {
    categoryId: input.category,
    question: input.question,
    answer: input.answer,
    codeExample: input.code_example,
  };
}

export async function categoryExists(id: number): Promise<boolean> {
  return (await db.category.findUnique({ where: { id }, select: { id: true } })) !== null;
}
