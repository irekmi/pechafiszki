import { db } from "@/server/db";
import { QUEUE_PATH } from "./adminQueueParams";
import type { DecisionResult } from "./recordDecision";

export const REVIEW_PATH = "/administracja/ocena";

/** A decision's result, plus where the screen goes next (SCR-17 behaviour rows 1-2). */
export type ReviewResult = DecisionResult | { ok: true; next: string };

/**
 * The address to open after deciding card `id`: the next pending card in queue order (oldest first,
 * ties by id) after it, else the first pending one, else SCR-16 when none is left. Read after the
 * decision, so a card another administrator decided in the meantime is never offered.
 */
export async function nextPendingAfter(id: number): Promise<string> {
  const decided = await db.flashcard.findUnique({ where: { id }, select: { submittedAt: true } });
  const order = [{ submittedAt: "asc" as const }, { id: "asc" as const }];
  const after = decided
    ? await db.flashcard.findFirst({
        where: {
          status: "PENDING",
          OR: [{ submittedAt: { gt: decided.submittedAt } }, { submittedAt: decided.submittedAt, id: { gt: id } }],
        },
        orderBy: order,
        select: { id: true },
      })
    : null;
  const next = after ?? (await db.flashcard.findFirst({ where: { status: "PENDING" }, orderBy: order, select: { id: true } }));
  return next ? `${REVIEW_PATH}/${next.id}` : QUEUE_PATH;
}
