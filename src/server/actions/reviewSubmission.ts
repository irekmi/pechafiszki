"use server";

import { revalidatePath } from "next/cache";
import { refuseNotFound, requireAdmin } from "@/server/permissions";
import { approveFlashcard } from "@/server/services/approveFlashcard";
import { nextPendingAfter, type ReviewResult } from "@/server/services/nextPendingAfter";
import { rejectFlashcard } from "@/server/services/rejectFlashcard";
import type { DecisionResult } from "@/server/services/recordDecision";
import { approveInput, rejectInput } from "./decisionInput";

/** After a decision made from SCR-17: tell the screen where to go (behaviour rows 1-2). */
async function advance(id: number, result: DecisionResult): Promise<ReviewResult> {
  if (!result.ok) return result;
  revalidatePath("/", "layout");
  return { ok: true, next: await nextPendingAfter(id) };
}

/**
 * **Zatwierdź** on SCR-17 — API-20 with the possibly changed `category`, then the address of the next
 * pending submission or SCR-16. Session and role first (NFR-01); the decision is ST-14's service.
 */
export async function approveAndAdvanceAction(raw: unknown): Promise<ReviewResult> {
  const admin = await requireAdmin();
  const parsed = approveInput.safeParse(raw);
  if (!parsed.success) refuseNotFound();
  return advance(parsed.data.id, await approveFlashcard(admin, parsed.data.id, parsed.data.category));
}

/** **Odrzuć fiszkę** on SCR-17 — API-21 (reason 1-500, DEC-32), then the next submission or SCR-16. */
export async function rejectAndAdvanceAction(raw: unknown): Promise<ReviewResult> {
  const admin = await requireAdmin();
  const parsed = rejectInput.safeParse(raw);
  if (!parsed.success) refuseNotFound();
  return advance(parsed.data.id, await rejectFlashcard(admin, parsed.data.id, parsed.data.rejection_reason));
}
