"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { refuseNotFound, requireUser } from "@/server/permissions";
import { finishSession } from "@/server/services/finishSession";

const finishInputSchema = z.object({ sessionId: z.coerce.number().int().positive() });

/**
 * API-13 — **Zakończ sesję**. The caller comes from the session (a Guest is sent to SCR-01 by
 * `requireUser`); a session that is not theirs ends at SCR-22, the same answer as one that does not
 * exist (CLAUDE.md §8). The service closes it once and the redirect opens SCR-07.
 */
export async function finishSessionAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const parsed = finishInputSchema.safeParse({ sessionId: formData.get("sessionId") });
  if (!parsed.success) refuseNotFound();

  const summary = await finishSession(user.id, parsed.data.sessionId);
  if (!summary) refuseNotFound();
  redirect(`/podsumowanie/${summary.sessionId}`);
}
