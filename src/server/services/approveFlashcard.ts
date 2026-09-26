import { recordDecision, type DecisionResult } from "./recordDecision";

/**
 * API-20 — lets a submission into the shared pool: `PENDING` → `APPROVED` with a Moderation Decision
 * naming the administrator. The caller has passed `requireAdmin`; `admin.id` is the session's.
 */
export function approveFlashcard(admin: { id: number }, id: number): Promise<DecisionResult> {
  return recordDecision({ id, decision: "APPROVED", adminId: admin.id, reason: null });
}
