import { recordDecision, type DecisionResult } from "./recordDecision";

/**
 * API-20 — lets a submission into the shared pool: `PENDING` → `APPROVED` with a Moderation Decision
 * naming the administrator. The caller has passed `requireAdmin`; `admin.id` is the session's. The
 * optional `categoryId` is the category the card enters the pool under (SCR-17).
 */
export function approveFlashcard(admin: { id: number }, id: number, categoryId?: number): Promise<DecisionResult> {
  return recordDecision({ id, decision: "APPROVED", adminId: admin.id, reason: null, categoryId });
}
