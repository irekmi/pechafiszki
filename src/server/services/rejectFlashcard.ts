import { reasonSchema, REASON_REQUIRED } from "./rejectReason";
import { recordDecision, type DecisionResult } from "./recordDecision";

/**
 * API-21 — refuses a submission with the reason its author will read: `PENDING` → `REJECTED` and a
 * Moderation Decision carrying the reason. The reason is validated here, not only in the modal, so no
 * caller — the browser, a replayed action — can write a rejection without one (DEC-32).
 */
export async function rejectFlashcard(admin: { id: number }, id: number, reason: string): Promise<DecisionResult> {
  const parsed = reasonSchema.safeParse(reason);
  if (!parsed.success) {
    return { ok: false, reason: "invalid", message: parsed.error.issues[0]?.message ?? REASON_REQUIRED };
  }
  return recordDecision({ id, decision: "REJECTED", adminId: admin.id, reason: parsed.data });
}
