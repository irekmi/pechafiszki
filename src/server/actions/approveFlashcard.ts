"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { refuseNotFound, requireAdmin } from "@/server/permissions";
import { approveFlashcard } from "@/server/services/approveFlashcard";
import type { DecisionResult } from "@/server/services/recordDecision";

const input = z.object({ id: z.number().int().min(1).max(2_147_483_647) });

/**
 * API-20 — **Zatwierdź**. The role is read from the session, first, before anything else: a User or
 * a Guest never reaches the service, whatever the request carries (NFR-01). The queue and every
 * counter drawn from it are revalidated so the row leaves with the toast (behaviour row 1).
 */
export async function approveFlashcardAction(raw: unknown): Promise<DecisionResult> {
  const admin = await requireAdmin();
  const parsed = input.safeParse(raw);
  if (!parsed.success) refuseNotFound();
  const result = await approveFlashcard(admin, parsed.data.id);
  revalidatePath("/", "layout");
  return result;
}
