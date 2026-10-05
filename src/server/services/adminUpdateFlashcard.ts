import { db } from "@/server/db";
import { REFUSED, cardFields, categoryExists, type EditResult } from "./editResult";
import { recordDecision } from "./recordDecision";
import type { SubmitFlashcardInput } from "./submitFlashcard";

/**
 * API-22 — an administrator edits any card in any status, optionally approving it in the same save
 * (DEC-34). Without `approve` the status is not touched. With it, the approval is ST-14's
 * `recordDecision` (from `PENDING` or `REJECTED`), which writes the text, the status and the Moderation
 * Decision in one guarded transaction — the only approval implementation. The caller has passed
 * `requireAdmin`; `admin.id` is the session's.
 */
export async function adminUpdateFlashcard(
  admin: { id: number },
  id: number,
  input: SubmitFlashcardInput,
  approve: boolean,
): Promise<EditResult> {
  if (!(await categoryExists(input.category))) return REFUSED.category;

  if (!approve) {
    const saved = await db.flashcard.updateMany({ where: { id }, data: cardFields(input) });
    return saved.count === 1 ? { ok: true } : REFUSED.notFound;
  }

  const result = await recordDecision({
    id,
    decision: "APPROVED",
    adminId: admin.id,
    reason: null,
    categoryId: input.category,
    from: ["PENDING", "REJECTED"],
    edit: { question: input.question, answer: input.answer, codeExample: input.code_example },
  });
  if (result.ok) return { ok: true };
  if (result.reason === "invalid") return REFUSED.category;
  // Guarded out: either the card is gone or it was approved already.
  return (await db.flashcard.findUnique({ where: { id }, select: { id: true } })) ? REFUSED.approved : REFUSED.notFound;
}
