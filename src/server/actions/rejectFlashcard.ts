"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { refuseNotFound, requireAdmin } from "@/server/permissions";
import { rejectFlashcard } from "@/server/services/rejectFlashcard";
import type { DecisionResult } from "@/server/services/recordDecision";

/** `rejection_reason` is API-21's field name; a value that is not text counts as no reason at all. */
const input = z.object({
  id: z.number().int().min(1).max(2_147_483_647),
  rejection_reason: z.string().catch(""),
});

/**
 * API-21 — **Odrzuć fiszkę**. Session and role first (NFR-01); the reason's 1-500 characters are
 * enforced by the service, so an empty one is refused here whatever the browser did (DEC-32, AC-14.3).
 */
export async function rejectFlashcardAction(raw: unknown): Promise<DecisionResult> {
  const admin = await requireAdmin();
  const parsed = input.safeParse(raw);
  if (!parsed.success) refuseNotFound();
  const result = await rejectFlashcard(admin, parsed.data.id, parsed.data.rejection_reason);
  revalidatePath("/", "layout");
  return result;
}
