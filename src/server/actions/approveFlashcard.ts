"use server";

import { revalidatePath } from "next/cache";
import { refuseNotFound, requireAdmin } from "@/server/permissions";
import { approveFlashcard } from "@/server/services/approveFlashcard";
import type { DecisionResult } from "@/server/services/recordDecision";
import { approveInput } from "./decisionInput";

/**
 * API-20 — **Zatwierdź**. The role is read from the session, first, before anything else: a User or
 * a Guest never reaches the service, whatever the request carries (NFR-01). The queue and every
 * counter drawn from it are revalidated so the row leaves with the toast (behaviour row 1).
 */
export async function approveFlashcardAction(raw: unknown): Promise<DecisionResult> {
  const admin = await requireAdmin();
  const parsed = approveInput.safeParse(raw);
  if (!parsed.success) refuseNotFound();
  const result = await approveFlashcard(admin, parsed.data.id, parsed.data.category);
  revalidatePath("/", "layout");
  return result;
}
