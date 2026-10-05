"use server";

import { revalidatePath } from "next/cache";
import { refuseNotFound, requireAdmin } from "@/server/permissions";
import { rejectFlashcard } from "@/server/services/rejectFlashcard";
import type { DecisionResult } from "@/server/services/recordDecision";
import { rejectInput } from "./decisionInput";

/**
 * API-21 — **Odrzuć fiszkę**. Session and role first (NFR-01); the reason's 1-500 characters are
 * enforced by the service, so an empty one is refused here whatever the browser did (DEC-32, AC-14.3).
 */
export async function rejectFlashcardAction(raw: unknown): Promise<DecisionResult> {
  const admin = await requireAdmin();
  const parsed = rejectInput.safeParse(raw);
  if (!parsed.success) refuseNotFound();
  const result = await rejectFlashcard(admin, parsed.data.id, parsed.data.rejection_reason);
  revalidatePath("/", "layout");
  return result;
}
