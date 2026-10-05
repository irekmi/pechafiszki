import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/server/db";
import { cleanText } from "./cleanText";

/**
 * API-16 — writes one flashcard into the approval queue. Nothing here reads a status or an author
 * from the caller's input: the row is always `PENDING` and authored by the session user handed in
 * by the action (NFR-01, REQ-01, AC-13.3). The schema is exported so the action validates with the
 * same rules this service was written for — one definition of "a valid submission" (DEC-27, DEC-28).
 */

export const CATEGORY_MESSAGE = "Wybierz kategorię";
const MAX_QUESTION = 200;
const MAX_TEXT = 1200;

const text = z.string().default("").transform(cleanText);

export const submitFlashcardSchema = z.object({
  category: z
    .string()
    .default("")
    .pipe(z.string().trim().regex(/^\d{1,10}$/, CATEGORY_MESSAGE))
    .transform(Number)
    .refine((id) => id >= 1 && id <= 2_147_483_647, CATEGORY_MESSAGE),
  question: text.pipe(
    z.string().trim().min(1, "Pytanie jest wymagane").max(MAX_QUESTION, "Pytanie może mieć najwyżej 200 znaków"),
  ),
  answer: text.pipe(
    z.string().trim().min(1, "Odpowiedź jest wymagana").max(MAX_TEXT, "Odpowiedź może mieć najwyżej 1200 znaków"),
  ),
  // Optional (DEC-28); indentation and newlines are kept, so the value is not trimmed — only an
  // all-blank example counts as "none".
  code_example: text
    .pipe(z.string().max(MAX_TEXT, "Przykład kodu może mieć najwyżej 1200 znaków"))
    .transform((code) => (code.trim() === "" ? null : code)),
});

export type SubmitFlashcardInput = z.output<typeof submitFlashcardSchema>;

export type SubmitFlashcardResult =
  | { ok: true; id: number }
  | { ok: false; reason: "category" | "no-categories" };

async function refusalFor(): Promise<SubmitFlashcardResult> {
  const anyCategory = await db.category.findFirst({ select: { id: true } });
  return { ok: false, reason: anyCategory ? "category" : "no-categories" };
}

export async function submitFlashcard(
  author: { id: number },
  input: SubmitFlashcardInput,
): Promise<SubmitFlashcardResult> {
  const category = await db.category.findUnique({ where: { id: input.category }, select: { id: true } });
  if (!category) return refusalFor();

  try {
    const card = await db.flashcard.create({
      data: {
        categoryId: category.id,
        question: input.question,
        answer: input.answer,
        codeExample: input.code_example,
        authorId: author.id,
        status: "PENDING",
      },
      select: { id: true },
    });
    return { ok: true, id: card.id };
  } catch (error) {
    // The category was deleted between the check and the write (foreign key `P2003`).
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") return refusalFor();
    throw error;
  }
}
