"use server";

import { z } from "zod";
import { refuseNotFound, requireUser } from "@/server/permissions";
import { markCard } from "@/server/services/markCard";

const markInputSchema = z.object({
  flashcardId: z.number().int().positive(),
  mark: z.enum(["KNOW", "REPEAT", "UNKNOWN"]),
  sessionId: z.number().int().positive().optional(),
});

/** What the marking buttons need back — no dates, nothing about anyone else's progress. */
export type MarkActionResult = { status: "ok" | "skipped"; knowCount?: number };

/**
 * API-12 — records a marking. The caller comes from the session, never from the input (REQ-02): a
 * Guest is sent to SCR-01 by `requireUser`, and a card that is not in the caller's own open queue
 * ends at SCR-22, the same answer as a card that does not exist (CLAUDE.md §8). Every study rule
 * runs inside `markCard` through `src/domain/`.
 */
export async function markCardAction(input: unknown): Promise<MarkActionResult> {
  const user = await requireUser();
  const parsed = markInputSchema.safeParse(input);
  if (!parsed.success) refuseNotFound();

  const result = await markCard(user, parsed.data);
  if (result.status === "forbidden") refuseNotFound();
  return result.status === "ok" ? { status: "ok", knowCount: result.knowCount } : { status: "skipped" };
}
